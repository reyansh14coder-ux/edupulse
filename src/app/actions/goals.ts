"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

async function myStudentId() {
  const session = await requireSession(["STUDENT"]);
  const student = await db.student.findUnique({
    where: { userId: session.sub },
    select: { id: true },
  });
  if (!student) throw new Error("Student profile not found.");
  return student.id;
}

export async function addGoalAction(formData: FormData) {
  const studentId = await myStudentId();
  const title = String(formData.get("title") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  if (!title) return;
  await db.studentGoal.create({
    data: { studentId, title, note: note || null },
  });
  revalidatePath("/student/plan");
}

export async function toggleGoalAction(id: string, action: "done" | "drop") {
  const session = await requireSession(["STUDENT"]);
  const goal = await db.studentGoal.findUnique({
    where: { id },
    include: { student: { select: { userId: true } } },
  });
  if (!goal || goal.student.userId !== session.sub || goal.kind !== "GOAL")
    throw new Error("Not allowed.");
  await db.studentGoal.update({
    where: { id },
    data: { status: action === "done" ? "DONE" : "DROPPED" },
  });
  revalidatePath("/student/plan");
}

export async function reopenGoalAction(id: string) {
  const session = await requireSession(["STUDENT"]);
  const goal = await db.studentGoal.findUnique({
    where: { id },
    include: { student: { select: { userId: true } } },
  });
  if (!goal || goal.student.userId !== session.sub) throw new Error("Not allowed.");
  await db.studentGoal.update({ where: { id }, data: { status: "ACTIVE" } });
  revalidatePath("/student/plan");
}

export async function reflectAction(formData: FormData) {
  const studentId = await myStudentId();
  const note = String(formData.get("note") ?? "").trim();
  if (!note) return;
  await db.studentGoal.create({
    data: {
      studentId,
      kind: "REFLECTION",
      title: "Self-reflection",
      note,
      status: "SAVED",
    },
  });
  revalidatePath("/student/plan");
}
