import Link from "next/link";
import { notFound } from "next/navigation";
import { FileQuestion, Sparkles, Trophy } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { PracticeQuizButton } from "@/components/teacher-forms";
import { fmtDate } from "@/lib/utils";
import { Badge, Card, CardHeader, PageHeader } from "@/components/ui";

export const metadata = { title: "Quizzes" };

export default async function StudentQuizzesPage() {
  const session = await requireSession(["STUDENT"]);
  const student = await db.student.findUnique({
    where: { userId: session.sub },
    select: { id: true, classId: true },
  });
  if (!student) notFound();

  const [quizzes, attempts] = await Promise.all([
    db.quiz.findMany({
      where: { classId: student.classId },
      orderBy: { createdAt: "desc" },
    }),
    db.quizAttempt.findMany({
      where: { studentId: student.id },
      select: { quizId: true, score: true, total: true },
    }),
  ]);
  const attemptBy = new Map(attempts.map((a) => [a.quizId, a]));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="AI quizzes"
        sub="Personalized assessments generated from your syllabus — every result is added to your progress history."
        action={
          <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-2">
            <PracticeQuizButton />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {quizzes.map((q) => {
          const attempt = attemptBy.get(q.id);
          const count = JSON.parse(q.questions).length;
          return (
            <Link key={q.id} href={`/student/quizzes/${q.id}`} className="group">
              <Card className="h-full p-5 transition group-hover:-translate-y-1 group-hover:shadow-pop/50">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                    <FileQuestion size={20} />
                  </span>
                  {attempt ? (
                    <Badge tone={attempt.score / attempt.total >= 0.6 ? "success" : "warning"}>
                      <Trophy size={11} /> {attempt.score}/{attempt.total}
                    </Badge>
                  ) : (
                    <Badge tone="brand">
                      <Sparkles size={11} /> Not attempted
                    </Badge>
                  )}
                </div>
                <p className="mt-3.5 font-display text-[15px] font-extrabold leading-snug text-ink-900">
                  {q.title}
                </p>
                <p className="mt-1 text-[12.5px] text-ink-500">
                  {q.subject}
                  {q.chapter ? ` · ${q.chapter}` : ""} · {count} questions ·{" "}
                  {fmtDate(q.createdAt)}
                </p>
                <p className="mt-3 text-[13px] font-bold text-brand-600 opacity-0 transition group-hover:opacity-100">
                  {attempt ? "Review your attempt →" : "Start quiz →"}
                </p>
              </Card>
            </Link>
          );
        })}
        {!quizzes.length && (
          <Card className="sm:col-span-2 xl:col-span-3">
            <p className="px-5 py-12 text-center text-[14px] text-ink-500">
              No quizzes yet — generate a personalized practice quiz with the button above.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
