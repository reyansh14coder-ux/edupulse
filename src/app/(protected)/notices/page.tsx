import { Megaphone, Pin } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNoticeAction, deleteNoticeAction } from "@/app/actions/notices";
import { logAudit } from "@/lib/audit";
import { fmtDate } from "@/lib/utils";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  inputCls,
  labelCls,
} from "@/components/ui";

export const metadata = { title: "Notices" };

export default async function NoticesPage() {
  const session = await requireSession();
  const isStaff = session.role === "ADMIN" || session.role === "TEACHER";

  const notices = await db.notice.findMany({
    where: isStaff
      ? undefined
      : { OR: [{ audience: "ALL" }, { audience: session.role }] },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  await logAudit("VIEW_NOTICES", { detail: `${notices.length} notices` });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Notices"
        sub={
          isStaff
            ? "Post updates for students and parents — they appear on dashboards instantly."
            : "Latest updates from your school office and teachers."
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {isStaff && (
          <Card className="h-fit p-6 lg:col-span-1">
            <CardHeader title="Post a notice" sub="Visible to the selected audience" className="!px-0 !pt-0" />
            <form action={createNoticeAction} className="mt-4 space-y-4">
              <div>
                <label className={labelCls} htmlFor="n-title">Title</label>
                <input
                  id="n-title"
                  name="title"
                  required
                  maxLength={160}
                  placeholder="Half-yearly exam timetable released"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="n-body">Message</label>
                <textarea
                  id="n-body"
                  name="body"
                  required
                  rows={5}
                  maxLength={2000}
                  placeholder="Exams begin next Monday. Check the notice board daily…"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="n-audience">Audience</label>
                <select id="n-audience" name="audience" defaultValue="ALL" className={inputCls}>
                  <option value="ALL">Everyone (students &amp; parents)</option>
                  <option value="STUDENT">Students only</option>
                  <option value="PARENT">Parents only</option>
                </select>
              </div>
              <Button type="submit">
                <Pin size={15} /> Publish notice
              </Button>
            </form>
          </Card>
        )}

        <div className={isStaff ? "space-y-4 lg:col-span-2" : "space-y-4 lg:col-span-3"}>
          {notices.map((n) => (
            <Card key={n.id} className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Megaphone size={16} />
                  </span>
                  <div>
                    <h3 className="font-display text-[15px] font-extrabold text-ink-900">
                      {n.title}
                    </h3>
                    <p className="mt-0.5 text-[12.5px] text-ink-500">
                      {n.authorName} · {fmtDate(n.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={n.audience === "ALL" ? "brand" : n.audience === "STUDENT" ? "info" : "success"}>
                    {n.audience === "ALL" ? "Everyone" : n.audience === "STUDENT" ? "Students" : "Parents"}
                  </Badge>
                  {session.role === "ADMIN" && (
                    <form action={deleteNoticeAction.bind(null, n.id)}>
                      <button
                        type="submit"
                        className="text-[12.5px] font-bold text-rose-500 transition hover:text-rose-600"
                      >
                        Remove
                      </button>
                    </form>
                  )}
                </div>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-ink-700">{n.body}</p>
            </Card>
          ))}
          {!notices.length && (
            <Card>
              <EmptyState
                title="No notices right now"
                hint="New announcements from the school will appear here."
                icon={<Megaphone size={20} />}
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
