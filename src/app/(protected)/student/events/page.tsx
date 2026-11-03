import { CalendarDays } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "Events" };

const KIND_TONE: Record<string, "brand" | "info" | "warning" | "danger" | "success"> = {
  EVENT: "brand",
  HOLIDAY: "success",
  MEETING: "info",
  EXAM: "warning",
};

export default async function StudentEventsPage() {
  await requireSession(["STUDENT"]);
  const now = new Date();
  const events = await db.schoolEvent.findMany({ orderBy: { date: "asc" } });
  const upcoming = events.filter((e) => e.date >= now);
  const past = events.filter((e) => e.date < now).reverse();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="School events"
        sub="Holidays, exams, functions and meetings — straight from the school office."
        action={<Badge tone="info">{upcoming.length} coming up</Badge>}
      />

      <Card className="p-6">
        {upcoming.length ? (
          <ul className="space-y-3">
            {upcoming.map((e) => (
              <li key={e.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-line p-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={KIND_TONE[e.kind] ?? "neutral"}>{e.kind.toLowerCase()}</Badge>
                    {e.location && <Badge tone="neutral">{e.location}</Badge>}
                  </div>
                  <p className="mt-1.5 text-[14.5px] font-bold text-ink-900">{e.title}</p>
                  {e.description && (
                    <p className="mt-0.5 max-w-2xl text-[13px] leading-relaxed text-ink-600">{e.description}</p>
                  )}
                </div>
                <p className="whitespace-nowrap text-[13px] font-bold text-ink-700">{fmtDate(e.date)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Nothing scheduled" hint="New events will show up here." icon={<CalendarDays size={20} />} />
        )}
      </Card>

      {past.length > 0 && (
        <Card className="mt-6 p-6">
          <p className="text-[12px] font-bold uppercase tracking-wider text-ink-400">Recently passed</p>
          <ul className="mt-3 divide-y divide-line">
            {past.slice(0, 8).map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2.5">
                <p className="text-[13px] font-semibold text-ink-600">{e.title}</p>
                <span className="text-[12px] text-ink-400">{fmtDate(e.date)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
