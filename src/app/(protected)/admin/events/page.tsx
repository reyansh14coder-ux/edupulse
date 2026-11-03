import { CalendarDays, Plus } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { createEventAction } from "@/app/actions/erp";
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

export const metadata = { title: "Events calendar" };

const KIND_TONE: Record<string, "brand" | "info" | "warning" | "danger" | "success"> = {
  EVENT: "brand",
  HOLIDAY: "success",
  MEETING: "info",
  EXAM: "warning",
};

export default async function AdminEventsPage() {
  await requireSession(["ADMIN"]);
  const now = new Date();
  const events = await db.schoolEvent.findMany({ orderBy: { date: "asc" } });
  const upcoming = events.filter((e) => e.date >= now);
  const past = events.filter((e) => e.date < now).reverse();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Events calendar"
        sub="Holidays, meetings, exams and functions — visible to students and parents the moment you add them."
        action={<Badge tone="info">{upcoming.length} upcoming</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card className="p-6">
            <CardHeader title="Coming up" className="!px-0 !pt-0" />
            {upcoming.length ? (
              <ul className="mt-4 space-y-3">
                {upcoming.map((e) => (
                  <li
                    key={e.id}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-line p-4"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={KIND_TONE[e.kind] ?? "neutral"}>{e.kind.toLowerCase()}</Badge>
                        <Badge tone="neutral">{e.audience.toLowerCase()}</Badge>
                      </div>
                      <p className="mt-1.5 text-[14px] font-bold text-ink-900">{e.title}</p>
                      {e.description && (
                        <p className="mt-0.5 text-[13px] leading-relaxed text-ink-600">{e.description}</p>
                      )}
                      {e.location && (
                        <p className="mt-1 text-[12px] font-semibold text-ink-400">📍 {e.location}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="whitespace-nowrap text-[13px] font-bold text-ink-800">{fmtDate(e.date)}</p>
                      <p className="text-[11.5px] text-ink-400">
                        {e.date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="Nothing scheduled yet"
                hint="Add the first event from the form."
                icon={<CalendarDays size={20} />}
              />
            )}
          </Card>

          {past.length > 0 && (
            <Card className="p-6">
              <CardHeader title="Recently passed" className="!px-0 !pt-0" />
              <ul className="mt-3 divide-y divide-line">
                {past.map((e) => (
                  <li key={e.id} className="flex items-center justify-between py-2.5">
                    <p className="text-[13px] font-semibold text-ink-600">{e.title}</p>
                    <span className="whitespace-nowrap text-[12px] text-ink-400">{fmtDate(e.date)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <Card className="h-fit p-6">
          <CardHeader title="New event" className="!px-0 !pt-0" />
          <form action={createEventAction} className="mt-4 space-y-3">
            <div>
              <label className={labelCls} htmlFor="ev-title">Title</label>
              <input id="ev-title" name="title" required maxLength={160} className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="ev-desc">Description</label>
              <textarea id="ev-desc" name="description" rows={3} maxLength={800} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="ev-date">Date</label>
                <input id="ev-date" name="date" type="date" required className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor="ev-kind">Kind</label>
                <select id="ev-kind" name="kind" className={inputCls}>
                  <option value="EVENT">Event</option>
                  <option value="HOLIDAY">Holiday</option>
                  <option value="MEETING">Meeting</option>
                  <option value="EXAM">Exam</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="ev-aud">Audience</label>
                <select id="ev-aud" name="audience" className={inputCls}>
                  <option value="ALL">Everyone</option>
                  <option value="STUDENT">Students</option>
                  <option value="PARENT">Parents</option>
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="ev-loc">Location</label>
                <input id="ev-loc" name="location" maxLength={120} placeholder="Assembly Hall" className={inputCls} />
              </div>
            </div>
            <Button type="submit">
              <Plus size={15} /> Add event
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
