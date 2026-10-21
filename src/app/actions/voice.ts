"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

const MOODS = ["GREAT", "OK", "TOUGH"];

export async function saveVoiceAction(formData: FormData) {
  const session = await requireSession(["STUDENT"]);
  const student = await db.student.findUnique({
    where: { userId: session.sub },
    select: { id: true },
  });
  if (!student) return;

  const mood = String(formData.get("mood") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 600);
  if (!MOODS.includes(mood)) return;

  await db.studentVoice.create({
    data: { studentId: student.id, mood, note: note || null },
  });
  revalidatePath("/student");
  revalidatePath("/student/plan");
}
