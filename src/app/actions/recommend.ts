"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ensureRecommendations } from "@/lib/ai";

export async function refreshRecommendationsAction(studentId: string) {
  const session = await requireSession(["ADMIN", "TEACHER", "STUDENT", "PARENT"]);

  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { classId: true, userId: true },
  });
  if (!student) throw new Error("Student not found.");

  if (session.role === "STUDENT") {
    if (student.userId !== session.sub) throw new Error("Not allowed for this student.");
  } else if (session.role === "PARENT") {
    const link = await db.parentLink.findFirst({
      where: { parentId: session.sub, studentId },
      select: { id: true },
    });
    if (!link) throw new Error("Not allowed for this student.");
  } else if (session.role === "TEACHER") {
    const teaches = await db.teacherAssignment.findFirst({
      where: { teacherId: session.sub, classId: student.classId },
      select: { id: true },
    });
    if (!teaches) throw new Error("You do not teach this student's class.");
  }

  await ensureRecommendations(studentId, true);
  revalidatePath("/students/" + studentId);
  revalidatePath("/student");
  revalidatePath("/parent");
  revalidatePath("/counseling");
}
