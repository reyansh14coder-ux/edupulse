import { CalendarOff, Check, X } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { reviewLeaveAction } from "@/app/actions/erp";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
} from "@/components/ui";

export const metadata = { title: "Leave requests" };

const TONE: Record<string, "success" | "danger" | "warning" | "neutral"> = {
  APPROVED: "success",
  REJECTED: "danger",
  PENDING: "warning",
};

export default async function AdminLeavePage() {
  await requireSession(["ADMIN"]);
  const requests = await db.leaveRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
    include: {
      student: {
        include: {
          user: { select: { name: true } },
          schoolClass: { select: { name: true, section: true } },
        },
      },
      staff: { select: { name: true, title: true } },
    },
  });
  const pending = requests.filter((r) => r.status === "PENDING");

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Leave requests"
        sub="Student and staff leave — approve or reject with a short note for the record."
        action={<Badge tone={pending.length ? "warning" : "neutral"}>{pending.length} pending</Badge>}
      />

      <Card>
        {requests.length ? (
          <div className="divide-y divide-line">
            {requests.map((r) => (
              <div key={r.id} className="flex flex-wrap items-start justify-between gap-4 px-6 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="neutral">{r.kind === "STAFF" ? "staff" : "student"}</Badge>
                    <Badge tone={TONE[r.status] ?? "neutral"}>{r.status.toLowerCase()}</Badge>
                  </div>
                  <p className="mt-1.5 text-[14px] font-bold text-ink-900">
                    {r.kind === "STAFF"
                      ? r.staff?.name ?? "Staff member"
                      : `${r.student?.user.name ?? "Student"} · ${r.student?.schoolClass.name ?? ""}`}
                    {r.kind === "STAFF" && r.staff?.title ? ` · ${r.staff.title}` : ""}
                  </p>
                  <p className="text-[12.5px] text-ink-500">
                    {fmtDate(r.from)} → {fmtDate(r.to)}
                  </p>
                  <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-ink-700">{r.reason}</p>
                  {r.note && (
                    <p className="mt-1 text-[12px] font-semibold text-ink-400">Note: {r.note}</p>
                  )}
                </div>
                {r.status === "PENDING" && (
                  <div className="flex items-center gap-2">
                    <form action={reviewLeaveAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="APPROVED" />
                      <div className="flex items-center gap-1.5">
                        <input
                          name="note"
                          placeholder="note (optional)"
                          maxLength={300}
                          className="w-36 rounded-lg border border-line bg-card px-2.5 py-1.5 text-[12.5px] text-ink-700"
                        />
                        <Button type="submit" size="sm">
                          <Check size={13} /> Approve
                        </Button>
                      </div>
                    </form>
                    <form action={reviewLeaveAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="REJECTED" />
                      <Button type="submit" size="sm" variant="outline">
                        <X size={13} /> Reject
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No leave requests"
            hint="Student and staff leave applications will appear here."
            icon={<CalendarOff size={20} />}
          />
        )}
      </Card>
      <p className="mt-3 text-[12px] text-ink-400">
        Note: approving a request does not alter attendance records — teachers still mark daily
        attendance as usual.
      </p>
    </div>
  );
}
