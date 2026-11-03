import { CalendarOff, Send } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { createStudentLeaveAction } from "@/app/actions/erp";
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

export const metadata = { title: "Leave" };

const TONE: Record<string, "success" | "danger" | "warning" | "neutral"> = {
  APPROVED: "success",
  REJECTED: "danger",
  PENDING: "warning",
};

export default async function ParentLeavePage() {
  const session = await requireSession(["PARENT"]);
  const link = await db.parentLink.findFirst({
    where: { parentId: session.sub },
    include: {
      student: {
        include: { user: { select: { name: true } }, schoolClass: { select: { name: true } } },
      },
    },
  });
  const requests = link
    ? await db.leaveRequest.findMany({
        where: { studentId: link.student.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Leave"
        sub={
          link
            ? `Raise leave for ${link.student.user.name} and track approvals.`
            : "Leave requests for your child."
        }
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
          {link ? (
            <form action={createStudentLeaveAction} className="mt-4 space-y-3">
              <input type="hidden" name="studentId" value={link.student.id} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="pl-from">From</label>
                  <input id="pl-from" name="from" type="date" required className={inputCls} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="pl-to">To</label>
                  <input id="pl-to" name="to" type="date" required className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls} htmlFor="pl-reason">Reason</label>
                <textarea id="pl-reason" name="reason" required rows={3} maxLength={500} className={inputCls} />
              </div>
              <Button type="submit">
                <Send size={15} /> Send request
              </Button>
            </form>
          ) : (
            <p className="mt-3 text-[13px] text-ink-500">No linked student found.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
