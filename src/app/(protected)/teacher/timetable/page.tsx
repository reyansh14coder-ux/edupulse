import { Clock } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "My timetable" };

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function TeacherTimetablePage() {
  const session = await requireSession(["TEACHER"]);
  const slots = await db.timetableSlot.findMany({
    where: { teacherId: session.sub },
    include: {
      schoolClass: { select: { name: true, section: true } },
      teacher: { select: { name: true } },
    },
    orderBy: [{ day: "asc" }, { period: "asc" }],
  });
  const byDay = new Map<string, typeof slots>();
  for (const s of slots) {
    const list = byDay.get(s.day) ?? [];
    list.push(s);
    byDay.set(s.day, list);
  }
  const subs = await db.substitution.findMany({
    where: { substituteTeacherId: session.sub, date: { gte: new Date() } },
    include: { schoolClass: { select: { name: true, section: true } } },
    orderBy: { date: "asc" },
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My timetable"
        sub="Periods you teach this week — plus substitutions you're covering."
        action={<Badge tone="info">{slots.length} periods</Badge>}
      />

      {subs.length > 0 && (
        <Card className="mb-6 border-brand-200 bg-brand-50/60 p-5">
          <p className="text-[12px] font-bold uppercase tracking-wider text-brand-700">
            You are covering
          </p>
          <ul className="mt-2 space-y-1">
            {subs.map((s) => (
              <li key={s.id} className="text-[13px] font-semibold text-ink-700">
                {fmtSub(s.date)} · Period {s.period} {s.subject} · {s.schoolClass.name}{" "}
                {s.schoolClass.section}
                {s.reason ? ` — ${s.reason}` : ""}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {DAYS.map((day) => {
          const list = byDay.get(day) ?? [];
          return (
            <Card key={day} className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-bold text-ink-900">{day}</p>
                <Badge tone="neutral">{list.length}</Badge>
              </div>
              {list.length ? (
                <ul className="mt-3 space-y-2">
                  {list.map((s) => (
                    <li
                      key={s.id}
                      className="rounded-xl bg-brand-50/70 px-3 py-2.5 ring-1 ring-brand-600/10"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] font-bold text-brand-700">{s.subject}</p>
                        <span className="text-[11px] font-bold text-ink-400">
                          P{s.period} · {s.startTime}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-ink-500">
                        {s.schoolClass.name} {s.schoolClass.section}
                        {s.room ? ` · ${s.room}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-[12.5px] text-ink-400">No classes</p>
              )}
            </Card>
          );
        })}
      </div>

      {!slots.length && (
        <Card className="mt-6">
          <EmptyState
            title="No periods assigned yet"
            hint="The admin assigns your periods on the timetable."
            icon={<Clock size={20} />}
          />
        </Card>
      )}
    </div>
  );
}

function fmtSub(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
