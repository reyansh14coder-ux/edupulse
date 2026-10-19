"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function planFormAction(recId: string, formData: FormData) {
  const session = await requireSession(["TEACHER", "ADMIN"]);
  const intent = String(formData.get("intent") ?? "save");

  const rec = await db.recommendation.findUnique({
    where: { id: recId },
    include: {
      student: {
        select: {
          id: true,
          user: { select: { name: true } },
          schoolClass: { select: { id: true } },
        },
      },
    },
  });
  if (!rec) throw new Error("Recommendation not found.");

  if (session.role === "TEACHER") {
    const teaches = await db.teacherAssignment.findFirst({
      where: { teacherId: session.sub, classId: rec.student.schoolClass.id },
    });
    if (!teaches) throw new Error("You do not teach this student's class.");
  }

  if (intent === "unshare") {
    await db.recommendation.update({
      where: { id: recId },
      data: { planStatus: "PROPOSED" },
    });
    await logAudit("UNSHARE_PLAN", {
      subject: rec.student.user.name,
      detail: rec.title,
    });
  } else {
    const plan = String(formData.get("plan") ?? "").trim();
    if (!plan) throw new Error("Plan steps cannot be empty.");
    const approved = intent === "approve";
    await db.recommendation.update({
      where: { id: recId },
      data: { plan, planStatus: approved ? "APPROVED" : "PROPOSED" },
    });
    await logAudit(approved ? "APPROVE_PLAN" : "SAVE_PLAN", {
      subject: rec.student.user.name,
      detail: rec.title,
    });
  }

  revalidatePath("/students/" + rec.student.id);
  revalidatePath("/student/plan");
  revalidatePath("/parent");
}
