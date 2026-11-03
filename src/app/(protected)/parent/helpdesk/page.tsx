import { LifeBuoy, Send } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { createTicketAction } from "@/app/actions/erp";
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

export const metadata = { title: "Help desk" };

const TONE: Record<string, "success" | "warning" | "neutral"> = {
  OPEN: "warning",
  ANSWERED: "success",
  CLOSED: "neutral",
};

export default async function ParentHelpdeskPage() {
  const session = await requireSession(["PARENT"]);
  const tickets = await db.helpdeskTicket.findMany({
    where: { raisedById: session.sub },
    orderBy: { createdAt: "desc" },
    include: { repliedBy: { select: { name: true } } },
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Help desk"
        sub="Fee questions, transport issues, facility requests — raise a ticket for the school office."
        action={<Badge tone="info">{tickets.length} tickets</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          {tickets.length ? (
            <div className="divide-y divide-line">
              {tickets.map((t) => (
                <div key={t.id} className="px-6 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={TONE[t.status] ?? "neutral"}>{t.status.toLowerCase()}</Badge>
                    <Badge tone="neutral">{t.category.toLowerCase()}</Badge>
                    <span className="text-[12px] text-ink-400">{fmtDate(t.createdAt)}</span>
                  </div>
                  <p className="mt-1.5 text-[14px] font-bold text-ink-900">{t.subject}</p>
                  <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-ink-700">{t.body}</p>
                  {t.reply ? (
                    <div className="mt-3 rounded-xl border border-mint-200 bg-mint-500/5 p-3.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-mint-600">
                        Reply from {t.repliedBy?.name ?? "staff"}
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-ink-700">{t.reply}</p>
                    </div>
                  ) : (
                    <p className="mt-2 text-[12.5px] font-semibold text-ink-400">Waiting for a reply…</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No tickets yet" hint="Raise your first ticket from the form." icon={<LifeBuoy size={20} />} />
          )}
        </Card>

        <Card className="h-fit p-6">
          <CardHeader title="Raise a ticket" className="!px-0 !pt-0" />
          <form action={createTicketAction} className="mt-4 space-y-3">
            <div>
              <label className={labelCls} htmlFor="ph-cat">Category</label>
              <select id="ph-cat" name="category" className={inputCls}>
                <option value="GENERAL">General</option>
                <option value="FEES">Fees</option>
                <option value="FACILITIES">Facilities</option>
                <option value="ACADEMICS">Academics</option>
                <option value="TRANSPORT">Transport</option>
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="ph-subject">Subject</label>
              <input id="ph-subject" name="subject" required maxLength={160} className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="ph-body">Details</label>
              <textarea id="ph-body" name="body" required rows={4} maxLength={1500} className={inputCls} />
            </div>
            <Button type="submit">
              <Send size={15} /> Submit ticket
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
