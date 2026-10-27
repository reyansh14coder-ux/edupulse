"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function logTeacherFeedbackAction(formData: FormData) {
  const session = await requireSession(["ADMIN", "TEACHER", "PARENT", "STUDENT"]);
  const teacherId = String(formData.get("teacherId") ?? "");
  const category = String(formData.get("category") ?? "COMPLAINT");
  const body = String(formData.get("body") ?? "").trim().slice(0, 800);
  if (!teacherId || !body) return;
  if (!["COMPLAINT", "PRAISE", "SUGGESTION"].includes(category)) return;

  await db.teacherFeedback.create({
    data: { teacherId, authorId: session.sub, category, body },
  });
  revalidatePath("/admin/teachers");
  revalidatePath("/counseling");
}

export async function setFeedbackStatusAction(id: string, status: string) {
  await requireSession(["ADMIN"]);
  if (!["NEW", "REVIEWED", "RESOLVED"].includes(status)) return;
  const existing = await db.teacherFeedback.findUnique({ where: { id } });
  if (!existing) return;
  await db.teacherFeedback.update({ where: { id }, data: { status } });
  revalidatePath("/admin/teachers");
  revalidatePath("/counseling");
}

export async function submitStudentFeedbackAction(formData: FormData) {
  const session = await requireSession(["STUDENT"]);
  const student = await db.student.findUnique({
    where: { userId: session.sub },
    select: { id: true },
  });
  if (!student) return;

  const category = String(formData.get("category") ?? "SUGGESTION");
  const subject = String(formData.get("subject") ?? "General").trim().slice(0, 80);
  const body = String(formData.get("body") ?? "").trim().slice(0, 800);
  if (!body || !["SUGGESTION", "COMPLAINT", "PRAISE"].includes(category)) return;

  await db.studentFeedback.create({
    data: { studentId: student.id, category, subject: subject || "General", body },
  });
  await logAudit("STUDENT_FEEDBACK", { subject: category, detail: body.slice(0, 80) });
  revalidatePath("/student");
  revalidatePath("/admin/students");
}

export async function setStudentFeedbackStatusAction(id: string, status: string) {
  await requireSession(["ADMIN"]);
  if (!["NEW", "REVIEWED", "RESOLVED"].includes(status)) return;
  const existing = await db.studentFeedback.findUnique({ where: { id } });
  if (!existing) return;
  await db.studentFeedback.update({ where: { id }, data: { status } });
  revalidatePath("/admin/students");
}
