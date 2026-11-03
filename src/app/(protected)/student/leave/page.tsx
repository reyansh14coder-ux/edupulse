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

export const metadata = { title: "My leave" };

const TONE: Record<string, "success" | "danger" | "warning" | "neutral"> = {
  APPROVED: "success",
  REJECTED: "danger",
  PENDING: "warning",
};

export default async function StudentLeavePage() {
  const session = await requireSession(["STUDENT"]);
  const student = await db.student.findUnique({ where: { userId: session.sub } });
  const requests = student
    ? await db.leaveRequest.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My leave"
        sub="Request time off — your class teacher reviews it quickly."
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
                    <p className="mt-1 text-[12.5px] font-semibold text-ink-500">Teacher note: {r.note}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No leave requests"
              hint="Use the form to ask for leave."
              icon={<CalendarOff size={20} />}
            />
          )}
        </Card>

        <Card className="h-fit p-6">
          <CardHeader title="Request leave" className="!px-0 !pt-0" />
          <form action={createStudentLeaveAction} className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="lv-from">From</label>
                <input id="lv-from" name="from" type="date" required className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor="lv-to">To</label>
                <input id="lv-to" name="to" type="date" required className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls} htmlFor="lv-reason">Reason</label>
              <textarea
                id="lv-reason"
                name="reason"
                required
                rows={3}
                maxLength={500}
                placeholder="Family function, doctor visit…"
                className={inputCls}
              />
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
