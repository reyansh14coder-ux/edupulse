import { LifeBuoy, Send, X } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { closeTicketAction, replyTicketAction } from "@/app/actions/erp";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  inputCls,
  labelCls,
} from "@/components/ui";

export const metadata = { title: "Help desk" };

const TONE: Record<string, "success" | "warning" | "info" | "neutral"> = {
  OPEN: "warning",
  ANSWERED: "success",
  CLOSED: "neutral",
};

export default async function AdminHelpdeskPage() {
  await requireSession(["ADMIN"]);
  const [tickets, students] = await Promise.all([
    db.helpdeskTicket.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
      include: {
        raisedBy: { select: { name: true, title: true } },
        repliedBy: { select: { name: true } },
      },
    }),
    db.student.findMany({
      include: { user: { select: { name: true } } },
    }),
  ]);
  const studentById = new Map(students.map((s) => [s.id, s.user.name]));
  const open = tickets.filter((t) => t.status === "OPEN");

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Help desk"
        sub="Issues raised by students, parents and staff — reply once, everyone sees it."
        action={<Badge tone={open.length ? "warning" : "neutral"}>{open.length} open</Badge>}
      />

      <Card>
        {tickets.length ? (
          <div className="divide-y divide-line">
            {tickets.map((t) => (
              <div key={t.id} className="px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={TONE[t.status] ?? "neutral"}>{t.status.toLowerCase()}</Badge>
                    <Badge tone="neutral">{t.category.toLowerCase()}</Badge>
                    <Badge tone="info">{t.role.toLowerCase()}</Badge>
                  </div>
                  <span className="text-[12px] text-ink-400">{fmtDate(t.createdAt)}</span>
                </div>
                <p className="mt-1.5 text-[14px] font-bold text-ink-900">{t.subject}</p>
                <p className="mt-0.5 text-[12.5px] text-ink-500">
                  {t.raisedBy.name}
                  {t.studentId && studentById.get(t.studentId)
                    ? ` · for ${studentById.get(t.studentId)}`
                    : ""}
                  {t.raisedBy.title ? ` · ${t.raisedBy.title}` : ""}
                </p>
                <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-ink-700">{t.body}</p>

                {t.reply ? (
                  <div className="mt-3 rounded-xl border border-mint-200 bg-mint-500/5 p-3.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-mint-600">
                      Replied by {t.repliedBy?.name ?? "Staff"}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-700">{t.reply}</p>
                  </div>
                ) : t.status !== "CLOSED" ? (
                  <form action={replyTicketAction} className="mt-3 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="id" value={t.id} />
                    <div className="min-w-[260px] flex-1">
                      <label className={labelCls} htmlFor={`reply-${t.id}`}>Reply</label>
                      <input
                        id={`reply-${t.id}`}
                        name="reply"
                        required
                        maxLength={1500}
                        placeholder="What did you do about it?"
                        className={inputCls}
                      />
                    </div>
                    <Button type="submit" size="sm">
                      <Send size={13} /> Send
                    </Button>
                  </form>
                ) : null}

                {t.status !== "CLOSED" && (
                  <form action={closeTicketAction.bind(null, t.id)} className="mt-2">
                    <button
                      type="submit"
                      className="flex items-center gap-1 text-[11.5px] font-bold uppercase tracking-wide text-ink-400 hover:text-rose-600"
                    >
                      <X size={12} /> close ticket
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Inbox zero"
            hint="Tickets from students, parents and staff will land here."
            icon={<LifeBuoy size={20} />}
          />
        )}
      </Card>
    </div>
  );
}
