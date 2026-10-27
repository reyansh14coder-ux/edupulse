"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function createCompetitionAction(formData: FormData) {
  const session = await requireSession(["ADMIN", "TEACHER"]);
  const title = String(formData.get("title") ?? "").trim().slice(0, 160);
  const body = String(formData.get("body") ?? "").trim().slice(0, 2000);
  const deadlineRaw = String(formData.get("deadline") ?? "");
  if (!title || !body) return;

  const deadline = deadlineRaw ? new Date(deadlineRaw) : null;
  if (deadline && Number.isNaN(deadline.getTime())) return;

  await db.competition.create({
    data: {
      title,
      body,
      deadline,
      createdById: session.sub,
      authorName: session.name,
    },
  });
  await logAudit("CREATE_COMPETITION", { subject: title });
  revalidatePath("/competitions");
}

export async function applyCompetitionAction(formData: FormData) {
  const session = await requireSession(["STUDENT", "PARENT"]);
  const competitionId = String(formData.get("competitionId") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 400);
  if (!competitionId) return;

  let studentId = "";
  if (session.role === "STUDENT") {
    const student = await db.student.findUnique({
      where: { userId: session.sub },
      select: { id: true },
    });
    studentId = student?.id ?? "";
  } else {
    const link = await db.parentLink.findFirst({
      where: { parentId: session.sub },
      select: { studentId: true },
    });
    studentId = link?.studentId ?? "";
  }
  if (!studentId) return;

  const competition = await db.competition.findUnique({
    where: { id: competitionId },
    select: { id: true, title: true, deadline: true },
  });
  if (!competition) return;
  if (competition.deadline && competition.deadline.getTime() < Date.now()) return;

  await db.competitionApplication.upsert({
    where: { competitionId_studentId: { competitionId, studentId } },
    create: { competitionId, studentId, note: note || null },
    update: { note: note || null },
  });
  await logAudit("APPLY_COMPETITION", { subject: competition.title });
  revalidatePath("/competitions");
}
