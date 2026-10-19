import { ShieldCheck } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "Audit log" };

const ACTION_TONE: Record<string, "brand" | "success" | "warning" | "danger" | "info"> = {
  VIEW_PROGRESS: "info",
  VIEW_WEEKLY_REPORT: "info",
  SHARE_PROGRESS: "warning",
  SAVE_PLAN: "brand",
  APPROVE_PLAN: "success",
  UNSHARE_PLAN: "warning",
};

export default async function AdminAuditPage() {
  await requireSession(["ADMIN"]);
  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 120,
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Privacy audit log"
        sub="Every progress view, plan approval and parent share — recorded with actor, target and time."
        action={
          <Badge tone={logs.length ? "success" : "neutral"}>
            {logs.length} events
          </Badge>
        }
      />

      <Card>
        {logs.length ? (
          <div className="overflow-x-auto px-2 pb-3 pt-2">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-ink-400">
                  <th className="px-4 py-2 font-bold">When</th>
                  <th className="px-4 py-2 font-bold">Who</th>
                  <th className="px-4 py-2 font-bold">Action</th>
                  <th className="px-4 py-2 font-bold">About</th>
                  <th className="px-4 py-2 font-bold">Detail</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-t border-line align-top">
                    <td className="whitespace-nowrap px-4 py-2.5 text-[12.5px] text-ink-500">
                      {fmtDate(l.createdAt)}
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="text-[13px] font-bold text-ink-900">{l.actorName}</p>
                      <p className="text-[11px] text-ink-400">{l.actorId.slice(0, 10)}…</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge tone={ACTION_TONE[l.action] ?? "neutral"}>
                        {l.action.replaceAll("_", " ").toLowerCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-[13px] font-semibold text-ink-700">
                      {l.subject ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-[12.5px] text-ink-500">
                      {l.detail ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No audit events yet"
            hint="Views of student progress, weekly reports, plan approvals and parent shares will appear here."
            icon={<ShieldCheck size={20} />}
          />
        )}
      </Card>
    </div>
  );
}
