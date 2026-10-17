"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function saveScoresAction(input: {
  classId: string;
  subject: string;
  assessmentId?: string;
  meta: { title: string; type: string; maxMarks: number; date: string };
  scores: { studentId: string; marks: number }[];
}) {
  const session = await requireSession(["TEACHER", "ADMIN"]);
  if (session.role === "TEACHER") {
    const assigned = await db.teacherAssignment.findFirst({
      where: {
        teacherId: session.sub,
        classId: input.classId,
        subject: input.subject,
      },
    });
    if (!assigned) throw new Error("Not assigned to this class and subject.");
  }

  if (!input.meta.title.trim()) throw new Error("Assessment title is required.");
  if (input.meta.maxMarks <= 0) throw new Error("Max marks must be greater than 0.");

  let assessmentId = input.assessmentId;
  if (assessmentId) {
    await db.assessment.update({
      where: { id: assessmentId },
      data: {
        title: input.meta.title,
        type: input.meta.type,
        maxMarks: input.meta.maxMarks,
        date: new Date(input.meta.date),
      },
    });
  } else {
    const created = await db.assessment.create({
      data: {
        title: input.meta.title,
        type: input.meta.type,
        classId: input.classId,
        subject: input.subject,
        date: new Date(input.meta.date),
        maxMarks: input.meta.maxMarks,
      },
    });
    assessmentId = created.id;
  }

  for (const s of input.scores) {
    if (s.marks < 0 || s.marks > input.meta.maxMarks)
      throw new Error(`Marks out of range for student.`);
    await db.score.upsert({
      where: {
        assessmentId_studentId: { assessmentId: assessmentId!, studentId: s.studentId },
      },
      update: { marks: s.marks },
      create: { assessmentId: assessmentId!, studentId: s.studentId, marks: s.marks },
    });
  }

  revalidatePath("/teacher/marks");
  revalidatePath("/teacher");
  return { ok: true as const };
}
