import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function logAudit(
  action: string,
  opts?: { subject?: string; detail?: string }
) {
  try {
    const session = await getSession();
    if (!session) return;
    await db.auditLog.create({
      data: {
        actorId: session.sub,
        actorName: session.name,
        action,
        subject: opts?.subject ?? null,
        detail: opts?.detail ?? null,
      },
    });
  } catch {
    // audit must never break the main flow
  }
}
