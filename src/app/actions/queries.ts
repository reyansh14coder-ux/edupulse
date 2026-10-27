"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const RECIPIENTS = ["TEACHER", "PRINCIPAL"];

export async function submitQueryAction(formData: FormData) {
  const session = await requireSession(["PARENT"]);
  const recipient = String(formData.get("recipient") ?? "TEACHER");
  const subject = String(formData.get("subject") ?? "").trim().slice(0, 80);
  const body = String(formData.get("body") ?? "").trim().slice(0, 1000);
  if (!body || !RECIPIENTS.includes(recipient)) return;

  const link = await db.parentLink.findFirst({
    where: { parentId: session.sub },
    select: { studentId: true },
  });

  await db.parentQuery.create({
    data: {
      parentId: session.sub,
      studentId: link?.studentId ?? null,
      recipient,
      subject: subject || null,
      body,
    },
  });
  await logAudit("SUBMIT_QUERY", { subject: recipient, detail: body.slice(0, 80) });
  revalidatePath("/parent/ask");
  revalidatePath("/admin");
  revalidatePath("/teacher");
}

export async function replyQueryAction(formData: FormData) {
  const session = await requireSession(["ADMIN", "TEACHER"]);
  const id = String(formData.get("id") ?? "");
  const reply = String(formData.get("reply") ?? "").trim().slice(0, 1200);
  if (!id || !reply) return;

  const existing = await db.parentQuery.findUnique({ where: { id } });
  if (!existing) return;

  await db.parentQuery.update({
    where: { id },
    data: { reply, status: "ANSWERED", repliedById: session.sub },
  });
  await logAudit("REPLY_QUERY", { detail: reply.slice(0, 80) });
  revalidatePath("/parent/ask");
  revalidatePath("/admin");
  revalidatePath("/teacher");
}

export async function setQueryStatusAction(id: string, status: string) {
  await requireSession(["ADMIN"]);
  if (!["OPEN", "ANSWERED", "CLOSED"].includes(status)) return;
  const existing = await db.parentQuery.findUnique({ where: { id } });
  if (!existing) return;
  await db.parentQuery.update({ where: { id }, data: { status } });
  revalidatePath("/admin");
  revalidatePath("/parent/ask");
}
