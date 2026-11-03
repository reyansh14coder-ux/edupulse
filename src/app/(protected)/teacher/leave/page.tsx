import { CalendarOff, Send } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { createStaffLeaveAction } from "@/app/actions/erp";
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

export const metadata = { title: "My leave" };

const TONE: Record<string, "success" | "danger" | "warning" | "neutral"> = {
  APPROVED: "success",
  REJECTED: "danger",
  PENDING: "warning",
};

export default async function TeacherLeavePage() {
  const session = await requireSession(["TEACHER"]);
  const requests = await db.leaveRequest.findMany({
    where: { kind: "STAFF", staffId: session.sub },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My leave"
        sub="Staff leave requests — the principal reviews them."
        action={<Badge tone="info">{requests.length} requests</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          {requests.length ? (
            <div className="divide-y divide-line">
              {requests.map((r) => (
                <div key={r.id} className="px-6 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={TONE[r.status] ?? "neutral"}>{r.status.toLowerCase()}</Badge>
                    <span className="text-[12.5px] font-semibold text-ink-500">
                      {fmtDate(r.from)} → {fmtDate(r.to)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-700">{r.reason}</p>
                  {r.note && (
                    <p className="mt-1 text-[12.5px] font-semibold text-ink-500">Note: {r.note}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No leave requests" hint="Use the form to request leave." icon={<CalendarOff size={20} />} />
          )}
        </Card>

        <Card className="h-fit p-6">
          <CardHeader title="Request leave" className="!px-0 !pt-0" />
          <form action={createStaffLeaveAction} className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="tl-from">From</label>
                <input id="tl-from" name="from" type="date" required className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor="tl-to">To</label>
                <input id="tl-to" name="to" type="date" required className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls} htmlFor="tl-reason">Reason</label>
              <textarea id="tl-reason" name="reason" required rows={3} maxLength={500} className={inputCls} />
            </div>
            <Button type="submit">
              <Send size={15} /> Send request
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
