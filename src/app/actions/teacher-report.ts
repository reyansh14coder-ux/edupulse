"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { weekMonday } from "@/lib/utils";

export async function submitWeeklyReportAction(formData: FormData) {
  const session = await requireSession(["ADMIN", "TEACHER"]);
  const body = String(formData.get("body") ?? "").trim().slice(0, 1500);
  if (!body) return;

  const weekOf = weekMonday();
  await db.teacherWeeklyReport.upsert({
    where: { teacherId_weekOf: { teacherId: session.sub, weekOf } },
    create: { teacherId: session.sub, weekOf, body },
    update: { body },
  });
  await logAudit("SUBMIT_WEEKLY_REPORT", { detail: body.slice(0, 80) });
  revalidatePath("/teacher");
  revalidatePath("/admin/teachers");
}
