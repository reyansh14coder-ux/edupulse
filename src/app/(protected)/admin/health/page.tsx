import { HeartPulse, Plus } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { addHealthIncidentAction } from "@/app/actions/erp";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  inputCls,
  labelCls,
} from "@/components/ui";

export const metadata = { title: "Health & safety" };

const TONE: Record<string, "danger" | "warning" | "success" | "info"> = {
  MAJOR: "danger",
  MINOR: "warning",
  INFO: "info",
};

export default async function AdminHealthPage() {
  await requireSession(["ADMIN"]);
  const [incidents, students] = await Promise.all([
    db.healthIncident.findMany({
      orderBy: { date: "desc" },
      take: 60,
      include: { student: { include: { user: { select: { name: true } } } } },
    }),
    db.student.findMany({
      orderBy: { rollNo: "asc" },
      include: { user: { select: { name: true } }, schoolClass: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Health & safety"
        sub="Infirmary notes, incidents and drills — kept in one place for the school record."
        action={<Badge tone="info">{incidents.length} entries</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          {incidents.length ? (
            <div className="divide-y divide-line">
              {incidents.map((h) => (
                <div key={h.id} className="px-6 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={TONE[h.severity] ?? "neutral"}>{h.severity.toLowerCase()}</Badge>
                    <Badge tone="neutral">{fmtDate(h.date)}</Badge>
                    {h.student && (
                      <Badge tone="info">{h.student.user.name}</Badge>
                    )}
                  </div>
                  <p className="mt-1.5 text-[14px] font-bold text-ink-900">{h.title}</p>
                  {h.note && (
                    <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-ink-700">{h.note}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No health entries yet" hint="Log the first incident or drill from the form." icon={<HeartPulse size={20} />} />
          )}
        </Card>

        <Card className="h-fit p-6">
          <CardHeader title="New entry" className="!px-0 !pt-0" />
          <form action={addHealthIncidentAction} className="mt-4 space-y-3">
            <div>
              <label className={labelCls} htmlFor="h-student">Student (optional)</label>
              <select id="h-student" name="studentId" className={inputCls} defaultValue="">
                <option value="">— general entry —</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.user.name} ({s.schoolClass.name})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="h-title">Title</label>
              <input id="h-title" name="title" required maxLength={200} placeholder="Mild sprain during PE" className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="h-note">Note</label>
              <textarea id="h-note" name="note" rows={3} maxLength={800} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="h-sev">Severity</label>
                <select id="h-sev" name="severity" className={inputCls}>
                  <option value="MINOR">Minor</option>
                  <option value="MAJOR">Major</option>
                  <option value="INFO">Info</option>
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="h-date">Date</label>
                <input id="h-date" name="date" type="date" className={inputCls} />
              </div>
            </div>
            <Button type="submit">
              <Plus size={15} /> Save entry
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
