"use server";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { deepDiveFor, type DeepDive } from "@/lib/deep-dive";

export async function diveDeeperAction(subject: string): Promise<DeepDive | null> {
  const session = await requireSession(["STUDENT"]);
  const student = await db.student.findUnique({
    where: { userId: session.sub },
    select: { id: true },
  });
  if (!student) return null;
  if (typeof subject !== "string" || subject.length > 40) return null;
  return deepDiveFor(student.id, subject);
}
