"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

const KINDS = ["ACTIVITY", "BEHAVIOUR"];

export async function logActivityAction(formData: FormData) {
  const session = await requireSession(["ADMIN", "TEACHER"]);
  const studentId = String(formData.get("studentId") ?? "");
  const kind = String(formData.get("kind") ?? "ACTIVITY");
  const title = String(formData.get("title") ?? "").trim().slice(0, 160);
  const note = String(formData.get("note") ?? "").trim().slice(0, 600);
  const dateRaw = String(formData.get("date") ?? "");
  if (!studentId || !title || !KINDS.includes(kind)) return;

  const date = dateRaw ? new Date(dateRaw) : new Date();
  if (Number.isNaN(date.getTime())) return;

  await db.studentActivity.create({
    data: {
      studentId,
      kind,
      title,
      note: note || null,
      date,
      createdById: session.sub,
    },
  });
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/parent/report");
  revalidatePath("/admin/students");
}

export async function deleteActivityAction(id: string) {
  await requireSession(["ADMIN"]);
  const existing = await db.studentActivity.findUnique({ where: { id } });
  if (!existing) return;
  await db.studentActivity.delete({ where: { id } });
  revalidatePath(`/students/${existing.studentId}`);
  revalidatePath("/parent/report");
}
