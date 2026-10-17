import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  QuizPlayer,
  QuizResult,
  type PlayerQuestion,
} from "@/components/quiz-player";
import { Badge, Card, PageHeader } from "@/components/ui";

export const metadata = { title: "Quiz" };

export default async function QuizDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession(["STUDENT"]);
  const { id } = await params;
  const student = await db.student.findUnique({
    where: { userId: session.sub },
    select: { id: true, classId: true },
  });
  if (!student) notFound();

  const quiz = await db.quiz.findUnique({
    where: { id },
    include: { schoolClass: true },
  });
  if (!quiz || quiz.classId !== student.classId) notFound();

  const attempt = await db.quizAttempt.findUnique({
    where: { quizId_studentId: { quizId: quiz.id, studentId: student.id } },
  });

  const questions = JSON.parse(quiz.questions) as PlayerQuestion[];

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <Link
        href="/student/quizzes"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-500 transition hover:text-brand-600"
      >
        <ArrowLeft size={14} /> All quizzes
      </Link>

      <PageHeader
        title={quiz.title}
        sub={`${quiz.subject}${quiz.chapter ? ` · ${quiz.chapter}` : ""} · ${quiz.schoolClass.name} ${quiz.schoolClass.section} · ${questions.length} questions`}
        action={
          <Badge tone="brand">
            <FileQuestion size={12} /> AI-generated
          </Badge>
        }
      />

      <Card className="overflow-hidden">
        {attempt ? (
          <QuizResult
            questions={questions}
            detail={JSON.parse(attempt.detail)}
            score={attempt.score}
          />
        ) : (
          <QuizPlayer quizId={quiz.id} questions={questions} />
        )}
      </Card>

      {attempt && (
        <p className="mt-4 text-center text-[13px] text-ink-500">
          One attempt per quiz keeps the record honest — use{" "}
          <Link href="/student/quizzes" className="font-bold text-brand-600">
            a new practice quiz
          </Link>{" "}
          to try again.
        </p>
      )}
    </div>
  );
}
