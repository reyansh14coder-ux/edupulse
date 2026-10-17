"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { createPracticeQuizForStudent, createClassQuiz } from "@/lib/ai";

export async function submitQuizAttemptAction(
  quizId: string,
  answers: number[]
) {
  const session = await requireSession(["STUDENT"]);
  const student = await db.student.findUnique({
    where: { userId: session.sub },
    select: { id: true },
  });
  if (!student) throw new Error("Student profile not found.");

  const quiz = await db.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) throw new Error("Quiz not found.");

  const existing = await db.quizAttempt.findUnique({
    where: { quizId_studentId: { quizId, studentId: student.id } },
  });
  if (existing) {
    redirect(`/student/quizzes/${quizId}`);
  }

  const questions = JSON.parse(quiz.questions) as {
    q: string;
    answer: number;
  }[];
  if (answers.length !== questions.length)
    throw new Error("Please answer every question.");

  let score = 0;
  const detail = questions.map((q, i) => {
    const correct = answers[i] === q.answer;
    if (correct) score++;
    return { picked: answers[i], correct };
  });

  await db.quizAttempt.create({
    data: {
      quizId,
      studentId: student.id,
      score,
      total: questions.length,
      detail: JSON.stringify(detail),
    },
  });

  const assessment = await db.assessment.findFirst({
    where: { title: `Quiz · ${quiz.title}`, classId: quiz.classId },
  });
  const saved =
    assessment ??
    (await db.assessment.create({
      data: {
        title: `Quiz · ${quiz.title}`,
        type: "QUIZ",
        classId: quiz.classId,
        subject: quiz.subject,
        date: new Date(),
        maxMarks: questions.length,
      },
    }));

  await db.score.upsert({
    where: {
      assessmentId_studentId: { assessmentId: saved.id, studentId: student.id },
    },
    update: { marks: score },
    create: { assessmentId: saved.id, studentId: student.id, marks: score },
  });

  const { ensureRecommendations } = await import("@/lib/ai");
  await ensureRecommendations(student.id, true);

  revalidatePath(`/student/quizzes/${quizId}`);
  revalidatePath("/student");
  revalidatePath("/students/" + student.id);
  redirect(`/student/quizzes/${quizId}`);
}

export async function generatePracticeQuizAction() {
  const session = await requireSession(["STUDENT"]);
  const student = await db.student.findUnique({
    where: { userId: session.sub },
    select: { id: true },
  });
  if (!student) throw new Error("Student profile not found.");
  const quiz = await createPracticeQuizForStudent(student.id);
  revalidatePath("/student/quizzes");
  redirect(`/student/quizzes/${quiz.id}`);
}

export async function createClassQuizAction(formData: FormData) {
  const session = await requireSession(["TEACHER", "ADMIN"]);
  const classId = String(formData.get("classId") ?? "");
  const subject = String(formData.get("subject") ?? "");
  const chapter = String(formData.get("chapter") ?? "") || null;

  if (!classId || !subject) throw new Error("Class and subject are required.");
  if (session.role === "TEACHER") {
    const assigned = await db.teacherAssignment.findFirst({
      where: { teacherId: session.sub, classId, subject },
    });
    if (!assigned) throw new Error("Not assigned to this class and subject.");
  }

  const quiz = await createClassQuiz({
    classId,
    subject,
    chapter,
    createdById: session.sub,
  });
  revalidatePath("/teacher/homework");
  revalidatePath("/teacher");
  return { ok: true as const, quizId: quiz.id };
}
