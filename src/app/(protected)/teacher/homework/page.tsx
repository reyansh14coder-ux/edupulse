import { notFound } from "next/navigation";
import { CalendarClock, FileQuestion, ListChecks } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate, isoDate, todayIST } from "@/lib/utils";
import {
  ActivityCreateForm,
  QuizCreateForm,
} from "@/components/teacher-forms";
import {
  Badge,
  Card,
  CardHeader,
  PageHeader,
  Progress,
} from "@/components/ui";

export const metadata = { title: "Activities" };

const KIND_TONE: Record<string, "brand" | "info" | "warning"> = {
  HOMEWORK: "brand",
  ASSIGNMENT: "info",
  PROJECT: "warning",
};

export default async function TeacherHomeworkPage() {
  const session = await requireSession(["TEACHER"]);

  const assignments = await db.teacherAssignment.findMany({
    where: { teacherId: session.sub },
    include: { schoolClass: true },
    orderBy: { schoolClass: { name: "asc" } },
  });
  if (!assignments.length) notFound();

  const classIds = [...new Set(assignments.map((a) => a.classId))];
  const subjectsByClass = new Map<string, Set<string>>();
  for (const a of assignments) {
    const set = subjectsByClass.get(a.classId) ?? new Set<string>();
    set.add(a.subject);
    subjectsByClass.set(a.classId, set);
  }

  const classes = await db.schoolClass.findMany({
    where: { id: { in: classIds } },
    orderBy: { name: "asc" },
    include: { chapters: true },
  });

  const formClasses = classes.map((c) => ({
    id: c.id,
    label: `${c.name} ${c.section}`,
    subjects: [...(subjectsByClass.get(c.id) ?? [])].map((name) => ({
      name,
      chapters: c.chapters
        .filter((ch) => ch.subject === name)
        .sort((a, b) => a.order - b.order)
        .map((ch) => ch.title),
    })),
  }));

  const [activities, quizzes] = await Promise.all([
    db.homework.findMany({
      where: { classId: { in: classIds } },
      include: {
        schoolClass: true,
        submissions: { select: { status: true } },
        assignedBy: { select: { name: true } },
      },
      orderBy: { dueDate: "desc" },
      take: 24,
    }),
    db.quiz.findMany({
      where: { classId: { in: classIds } },
      include: {
        schoolClass: true,
        attempts: { select: { score: true, total: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const today = todayIST();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Academic activities"
        sub="Homework, assignments & projects for your classes — plus AI quiz generation."
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Create activity"
            sub="Students see it instantly and submit work from their dashboard"
            action={
              <Badge tone="brand">
                <ListChecks size={12} /> Homework / Assignment / Project
              </Badge>
            }
          />
          <ActivityCreateForm classes={formClasses} />
        </Card>

        <Card>
          <CardHeader
            title="AI quiz generator"
            sub="5 MCQs from the syllabus-aligned question bank"
            action={
              <Badge tone="info">
                <FileQuestion size={12} /> Feeds into progress analysis
              </Badge>
            }
          />
          <QuizCreateForm classes={formClasses} />
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Recent activities"
            sub={`${activities.length} shown · submission status updates live`}
          />
          <div className="overflow-x-auto px-2 pb-3 pt-2">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-ink-400">
                  <th className="px-4 py-2 font-bold">Activity</th>
                  <th className="px-4 py-2 font-bold">Class</th>
                  <th className="px-4 py-2 font-bold">Due</th>
                  <th className="px-4 py-2 font-bold">Submissions</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => {
                  const total = a.submissions.length;
                  const done = a.submissions.filter((s) => s.status !== "PENDING").length;
                  const overdue = a.dueDate.getTime() < today.getTime();
                  return (
                    <tr key={a.id} className="border-t border-line">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Badge tone={KIND_TONE[a.kind] ?? "neutral"}>{a.kind}</Badge>
                          <span className="font-semibold text-ink-900">{a.title}</span>
                        </div>
                        <p className="mt-0.5 text-[12px] text-ink-400">
                          {a.subject} · by {a.assignedBy.name}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-ink-600">
                        {a.schoolClass.name} {a.schoolClass.section}
                      </td>
                      <td className="px-4 py-3">
                        <span className={overdue ? "font-bold text-rose-600" : "text-ink-600"}>
                          {fmtDate(a.dueDate)}
                        </span>
                        {overdue && (
                          <span className="ml-1.5 text-[11px] font-bold text-rose-500">
                            closed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Progress
                            value={total ? (done / total) * 100 : 0}
                            className="w-24"
                          />
                          <span className="text-[12.5px] font-bold text-ink-700">
                            {done}/{total}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!activities.length && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-ink-500">
                      No activities yet — create one above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="AI quizzes" sub="Generated quizzes & attempts" />
          <ul className="space-y-2 p-4">
            {quizzes.map((q) => {
              const avg = q.attempts.length
                ? Math.round(
                    (q.attempts.reduce((s, a) => s + (a.score / a.total) * 100, 0) /
                      q.attempts.length)
                  )
                : null;
              return (
                <li
                  key={q.id}
                  className="rounded-xl border border-line px-3.5 py-2.5 transition hover:border-brand-200 hover:bg-brand-50/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[13.5px] font-bold text-ink-900">
                      {q.title}
                    </p>
                    <Badge tone={avg !== null && avg >= 60 ? "success" : "neutral"}>
                      {avg !== null ? `${avg}% avg` : "not taken"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-ink-500">
                    {q.schoolClass.name} {q.schoolClass.section}
                    {q.chapter ? ` · focus: ${q.chapter}` : ""} · {q.attempts.length}{" "}
                    attempt{q.attempts.length === 1 ? "" : "s"}
                  </p>
                </li>
              );
            })}
            {!quizzes.length && (
              <li className="py-6 text-center text-[13px] text-ink-500">
                No quizzes yet — generate one above.
              </li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
