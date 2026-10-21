"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function createInterventionAction(formData: FormData) {
  const session = await requireSession(["ADMIN", "TEACHER"]);
  const studentId = String(formData.get("studentId") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 160);
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);
  if (!studentId || !title) return;

  await db.studentIntervention.create({
    data: { studentId, createdById: session.sub, title, note: note || null },
  });
  revalidatePath(`/students/${studentId}`);
}

export async function setInterventionStatusAction(id: string, status: string) {
  const session = await requireSession(["ADMIN", "TEACHER"]);
  const allowed = ["ACTIVE", "DONE"];
  if (!allowed.includes(status)) return;
  const existing = await db.studentIntervention.findUnique({ where: { id } });
  if (!existing) return;
  if (session.role === "TEACHER" && existing.createdById !== session.sub) return;

  await db.studentIntervention.update({ where: { id }, data: { status } });
  revalidatePath(`/students/${existing.studentId}`);
}

export async function setInterventionOutcomeAction(id: string, outcome: string) {
  const session = await requireSession(["ADMIN", "TEACHER"]);
  const allowed = ["HELPED", "NOT_YET"];
  if (!allowed.includes(outcome)) return;
  const existing = await db.studentIntervention.findUnique({ where: { id } });
  if (!existing) return;
  if (session.role === "TEACHER" && existing.createdById !== session.sub) return;

  await db.studentIntervention.update({ where: { id }, data: { outcome } });
  revalidatePath(`/students/${existing.studentId}`);
}
