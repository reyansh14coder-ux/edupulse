"use server";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { deepDiveFor, type DeepDive } from "@/lib/deep-dive";

export async function diveDeeperAction(subject: string): Promise<DeepDive | null> {
  const session = await requireSession(["STUDENT", "PARENT"]);
  let studentId: string | null = null;
  if (session.role === "STUDENT") {
    const student = await db.student.findUnique({
      where: { userId: session.sub },
      select: { id: true },
    });
    studentId = student?.id ?? null;
  } else {
    const link = await db.parentLink.findFirst({
      where: { parentId: session.sub },
      select: { studentId: true },
    });
    studentId = link?.studentId ?? null;
  }
  if (!studentId) return null;
  if (typeof subject !== "string" || subject.length > 40) return null;
  return deepDiveFor(studentId, subject);
}
