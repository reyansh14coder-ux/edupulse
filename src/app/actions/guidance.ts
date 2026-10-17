"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function scheduleSessionAction(formData: FormData) {
  const session = await requireSession(["ADMIN", "TEACHER"]);
  const studentId = String(formData.get("studentId") ?? "");
  const when = String(formData.get("when") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  const counselorId = String(formData.get("counselorId") || session.sub);

  if (!studentId || !when) return;

  await db.counselingSession.create({
    data: { studentId, counselorId, scheduledFor: new Date(when), status: "SCHEDULED", notes: notes || "Scheduled session" },
  });
  revalidatePath("/counseling");
  revalidatePath(`/students/${studentId}`);
}

export async function updateSessionStatusAction(id: string, status: string) {
  const session = await requireSession(["ADMIN", "TEACHER"]);

  const existing = await db.counselingSession.findUnique({ where: { id } });
  if (!existing) return;
  if (session.role === "TEACHER" && existing.counselorId !== session.sub) return;

  await db.counselingSession.update({ where: { id }, data: { status } });
  revalidatePath("/counseling");
  revalidatePath(`/students/${existing.studentId}`);
}

export async function createGuidanceNoteAction(formData: FormData) {
  const session = await requireSession(["ADMIN", "TEACHER"]);
  const studentId = String(formData.get("studentId") ?? "");
  const category = String(formData.get("category") ?? "ACADEMIC");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!studentId || !title || !body) return;

  await db.guidanceNote.create({
    data: { studentId, authorId: session.sub, category, title, body },
  });
  revalidatePath("/counseling");
  revalidatePath(`/students/${studentId}`);
}
