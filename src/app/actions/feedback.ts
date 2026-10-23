"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

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
