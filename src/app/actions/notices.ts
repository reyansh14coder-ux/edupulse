"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const AUDIENCES = ["ALL", "STUDENT", "PARENT"];

export async function createNoticeAction(formData: FormData) {
  const session = await requireSession(["ADMIN", "TEACHER"]);
  const title = String(formData.get("title") ?? "").trim().slice(0, 160);
  const body = String(formData.get("body") ?? "").trim().slice(0, 2000);
  const audience = String(formData.get("audience") ?? "ALL");
  if (!title || !body || !AUDIENCES.includes(audience)) return;

  await db.notice.create({
    data: {
      title,
      body,
      audience,
      createdById: session.sub,
      authorName: session.name,
    },
  });
  await logAudit("CREATE_NOTICE", { subject: title });
  revalidatePath("/notices");
  revalidatePath("/student");
}

export async function deleteNoticeAction(id: string) {
  const session = await requireSession(["ADMIN"]);
  const existing = await db.notice.findUnique({ where: { id } });
  if (!existing) return;
  await db.notice.delete({ where: { id } });
  await logAudit("DELETE_NOTICE", { subject: existing.title });
  revalidatePath("/notices");
}
