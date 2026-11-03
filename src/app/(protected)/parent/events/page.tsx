import { CalendarDays, Images } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { Badge, Card, CardHeader, EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "Events & school life" };

const KIND_TONE: Record<string, "brand" | "info" | "warning" | "danger" | "success"> = {
  EVENT: "brand",
  HOLIDAY: "success",
  MEETING: "info",
  EXAM: "warning",
};

export default async function ParentEventsPage() {
  await requireSession(["PARENT"]);
  const now = new Date();
  const [events, photos, exams] = await Promise.all([
    db.schoolEvent.findMany({ orderBy: { date: "asc" } }),
    db.galleryPhoto.findMany({ orderBy: { takenOn: "desc" }, take: 9 }),
    db.examOpportunity.findMany({ orderBy: { deadline: "asc" } }),
  ]);
  const upcoming = events.filter((e) => e.date >= now);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Events & school life"
        sub="The school calendar, photo highlights and competitive exams for your child."
        action={<Badge tone="info">{upcoming.length} upcoming</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card className="p-6">
          <CardHeader title="Calendar" className="!px-0 !pt-0" />
          {upcoming.length ? (
            <ul className="mt-4 space-y-3">
              {upcoming.map((e) => (
                <li key={e.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-line p-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={KIND_TONE[e.kind] ?? "neutral"}>{e.kind.toLowerCase()}</Badge>
                      {e.location && <Badge tone="neutral">{e.location}</Badge>}
                    </div>
                    <p className="mt-1.5 text-[14px] font-bold text-ink-900">{e.title}</p>
                    {e.description && (
                      <p className="mt-0.5 max-w-xl text-[13px] leading-relaxed text-ink-600">{e.description}</p>
                    )}
                  </div>
                  <p className="whitespace-nowrap text-[13px] font-bold text-ink-700">{fmtDate(e.date)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nothing scheduled" hint="Upcoming events will appear here." icon={<CalendarDays size={20} />} />
          )}
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <CardHeader title="Exam opportunities" className="!px-0 !pt-0" />
            {exams.length ? (
              <ul className="mt-3 space-y-3">
                {exams.map((e) => (
                  <li key={e.id} className="rounded-xl border border-line p-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {e.classes && <Badge tone="brand">{e.classes}</Badge>}
                      {e.deadline && (
                        <Badge tone={e.deadline.getTime() < now.getTime() ? "neutral" : "warning"}>
                          by {fmtDate(e.deadline)}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1.5 text-[13.5px] font-bold text-ink-900">{e.name}</p>
                    <p className="mt-0.5 line-clamp-2 text-[12.5px] text-ink-500">{e.body}</p>
                    {e.link && (
                      <a href={e.link} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[12.5px] font-bold text-brand-600 hover:underline">
                        Details →
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[13px] text-ink-500">No exams listed yet.</p>
            )}
          </Card>

          <Card className="p-6">
            <CardHeader title="Photo highlights" className="!px-0 !pt-0" />
            {photos.length ? (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {photos.map((p) => (
                  <figure key={p.id} className="overflow-hidden rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={p.title} className="h-20 w-full object-cover" loading="lazy" />
                  </figure>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-[13px] text-ink-500">Photos will appear here.</p>
            )}
            <p className="mt-3 flex items-center gap-1.5 text-[12.5px] font-bold text-ink-400">
              <Images size={13} /> More in the school gallery
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
