import { notFound } from "next/navigation";
import { CheckCircle2, Clock, FileCheck2, Send } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { submitHomeworkAction } from "@/app/actions/homework";
import { fmtDate } from "@/lib/utils";
import { Badge, Card, CardHeader, PageHeader, EmptyState } from "@/components/ui";

export const metadata = { title: "My activities" };

const KIND_TONE: Record<string, "brand" | "info" | "warning"> = {
  HOMEWORK: "brand",
  ASSIGNMENT: "info",
  PROJECT: "warning",
};

const NOW = Date.now();

export default async function StudentHomeworkPage() {
  const session = await requireSession(["STUDENT"]);
  const student = await db.student.findUnique({
    where: { userId: session.sub },
    include: {
      submissions: {
        include: {
          homework: {
            include: { assignedBy: { select: { name: true } } },
          },
        },
        orderBy: { homework: { dueDate: "desc" } },
      },
    },
  });
  if (!student) notFound();

  const rows = student.submissions.map((s) => ({
    ...s,
    overdue:
      s.status === "PENDING" && s.homework.dueDate.getTime() < NOW,
  }));

  const pending = rows.filter((r) => r.status === "PENDING");
  const completed = rows.filter((r) => r.status !== "PENDING");

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My activities"
        sub="Homework, assignments and projects — submitted work becomes part of your academic history."
        action={
          <Badge tone={pending.length ? "warning" : "success"}>
            {pending.length} pending · {completed.length} submitted
          </Badge>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Pending" sub="Submit before the due date to stay on track" />
          <ul className="space-y-3 p-4 pt-3">
            {pending.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl border border-line p-4 transition hover:border-brand-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={KIND_TONE[r.homework.kind] ?? "neutral"}>
                        {r.homework.kind}
                      </Badge>
                      <Badge tone={r.overdue ? "danger" : "neutral"}>
                        {r.overdue ? (
                          <>
                            <Clock size={11} /> Overdue
                          </>
                        ) : (
                          <>Due {fmtDate(r.homework.dueDate)}</>
                        )}
                      </Badge>
                    </div>
                    <p className="mt-2 font-display text-[14.5px] font-extrabold text-ink-900">
                      {r.homework.title}
                    </p>
                    <p className="mt-0.5 text-[12px] text-ink-500">
                      {r.homework.subject} · assigned by {r.homework.assignedBy.name}
                    </p>
                    <p className="mt-2 text-[13px] leading-relaxed text-ink-600">
                      {r.homework.description}
                    </p>
                  </div>
                  <form action={submitHomeworkAction.bind(null, r.homeworkId)}>
                    <button
                      type="submit"
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-[13px] font-bold text-white transition hover:bg-brand-700"
                    >
                      <Send size={13} /> Submit
                    </button>
                  </form>
                </div>
              </li>
            ))}
            {!pending.length && (
              <EmptyState
                title="All caught up!"
                hint="No pending activities right now. Check the quizzes section to keep practising."
                icon={<CheckCircle2 size={20} />}
              />
            )}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Submitted" sub="Your activity record" />
          <ul className="divide-y divide-line">
            {completed.map((r) => (
              <li key={r.id} className="px-5 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={KIND_TONE[r.homework.kind] ?? "neutral"}>
                        {r.homework.kind}
                      </Badge>
                      <Badge tone={r.status === "SUBMITTED" ? "success" : "warning"}>
                        {r.status === "SUBMITTED" ? (
                          <>
                            <CheckCircle2 size={11} /> Submitted
                          </>
                        ) : (
                          <>
                            <FileCheck2 size={11} /> Late
                          </>
                        )}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-[14px] font-bold text-ink-900">
                      {r.homework.title}
                    </p>
                    <p className="text-[12px] text-ink-500">
                      {r.homework.subject} · due {fmtDate(r.homework.dueDate)}
                      {r.submittedOn &&
                        ` · submitted ${fmtDate(r.submittedOn)}`}
                    </p>
                  </div>
                </div>
              </li>
            ))}
            {!completed.length && (
              <li className="px-5 py-10 text-center text-[13px] text-ink-500">
                Nothing submitted yet.
              </li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
