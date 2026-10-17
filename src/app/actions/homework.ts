"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function createHomeworkAction(formData: FormData) {
  const session = await requireSession(["TEACHER", "ADMIN"]);
  const classId = String(formData.get("classId") ?? "");
  const subject = String(formData.get("subject") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "");
  const kind = String(formData.get("kind") ?? "HOMEWORK");

  if (!classId || !subject || !title || !dueDate)
    throw new Error("All fields are required.");

  if (session.role === "TEACHER") {
    const assigned = await db.teacherAssignment.findFirst({
      where: { teacherId: session.sub, classId, subject },
    });
    if (!assigned) throw new Error("Not assigned to this class and subject.");
  }

  await db.homework.create({
    data: {
      title,
      description,
      kind: ["HOMEWORK", "ASSIGNMENT", "PROJECT"].includes(kind)
        ? kind
        : "HOMEWORK",
      classId,
      subject,
      dueDate: new Date(dueDate),
      assignedById: session.sub,
    },
  });

  revalidatePath("/teacher/homework");
  revalidatePath("/teacher");
  redirect("/teacher/homework");
}

export async function submitHomeworkAction(homeworkId: string) {
  const session = await requireSession(["STUDENT"]);
  const student = await db.student.findUnique({
    where: { userId: session.sub },
    select: { id: true },
  });
  if (!student) throw new Error("Student profile not found.");

  const now = new Date();
  const homework = await db.homework.findUnique({
    where: { id: homeworkId },
    select: { dueDate: true },
  });
  if (!homework) throw new Error("Homework not found.");

  const late = now.getTime() > homework.dueDate.getTime();

  await db.homeworkSubmission.upsert({
    where: { homeworkId_studentId: { homeworkId, studentId: student.id } },
    update: { status: late ? "LATE" : "SUBMITTED", submittedOn: now },
    create: {
      homeworkId,
      studentId: student.id,
      status: late ? "LATE" : "SUBMITTED",
      submittedOn: now,
    },
  });

  revalidatePath("/student/homework");
  revalidatePath("/student");
}
