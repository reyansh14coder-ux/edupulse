"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ensureRecommendations } from "@/lib/ai";

export async function refreshRecommendationsAction(studentId: string) {
  const session = await requireSession(["ADMIN", "TEACHER", "STUDENT", "PARENT"]);

  if (session.role === "STUDENT" || session.role === "PARENT") {
    const student = await db.student.findFirst({
      where:
        session.role === "STUDENT"
          ? { userId: session.sub }
          : { parentLinks: { some: { parentId: session.sub } } },
      select: { id: true },
    });
    if (!student || student.id !== studentId)
      throw new Error("Not allowed for this student.");
  }

  await ensureRecommendations(studentId, true);
  revalidatePath("/students/" + studentId);
  revalidatePath("/student");
  revalidatePath("/parent");
  revalidatePath("/counseling");
}
