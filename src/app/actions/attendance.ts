"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function saveAttendanceAction(input: {
  classId: string;
  date: string;
  entries: { studentId: string; status: string }[];
}) {
  const session = await requireSession(["TEACHER", "ADMIN"]);
  if (session.role === "TEACHER") {
    const assigned = await db.teacherAssignment.findFirst({
      where: { teacherId: session.sub, classId: input.classId },
    });
    if (!assigned) throw new Error("Not assigned to this class.");
  }
  if (!input.entries.length) throw new Error("No entries.");

  const date = new Date(input.date);
  for (const e of input.entries) {
    await db.attendance.upsert({
      where: { studentId_date: { studentId: e.studentId, date } },
      update: { status: e.status },
      create: { studentId: e.studentId, date, status: e.status },
    });
  }

  revalidatePath("/teacher/attendance");
  revalidatePath("/teacher");
  return { ok: true as const };
}
