"use server";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export type ShareState = { message: string } | null;

export async function shareProgressAction(
  _prev: ShareState,
  _formData: FormData
): Promise<ShareState> {
  const session = await requireSession(["PARENT"]);
  const link = await db.parentLink.findFirst({
    where: { parentId: session.sub },
    include: {
      student: { include: { user: { select: { name: true } } } },
      parent: { select: { email: true } },
    },
  });
  if (!link) throw new Error("No linked student found.");

  const coParents = await db.parentLink.findMany({
    where: { studentId: link.studentId, parentId: { not: session.sub } },
    include: { parent: { select: { email: true } } },
  });

  await logAudit("SHARE_PROGRESS", {
    subject: link.student.user.name,
    detail: coParents.length
      ? `Shared with: ${coParents.map((c) => c.parent.email).join(", ")}`
      : "No co-parent linked — sharing intent recorded only",
  });

  return {
    message: coParents.length
      ? `Shared with ${coParents.length} linked co-parent account(s) — recorded in the privacy audit log.`
      : "No co-parent is linked yet — your sharing intent was recorded in the privacy audit log.",
  };
}
