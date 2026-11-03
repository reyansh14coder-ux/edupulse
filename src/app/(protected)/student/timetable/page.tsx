import { Clock } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "My timetable" };

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function StudentTimetablePage() {
  const session = await requireSession(["STUDENT"]);
  const student = await db.student.findUnique({
    where: { userId: session.sub },
    include: { schoolClass: { select: { name: true, section: true } } },
  });
  const slots = student
    ? await db.timetableSlot.findMany({
        where: { classId: student.classId },
        include: { teacher: { select: { name: true } } },
        orderBy: { period: "asc" },
      })
    : [];
  const bySlot = new Map(slots.map((s) => [`${s.day}-${s.period}`, s]));
  const subs = student
    ? await db.substitution.findMany({
        where: { classId: student.classId, date: { gte: new Date() } },
        include: { substituteTeacher: { select: { name: true } } },
        orderBy: { date: "asc" },
      })
    : [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My timetable"
        sub={
          student
            ? `${student.schoolClass.name} ${student.schoolClass.section} · your class periods for the week.`
            : "Your class periods for the week."
        }
        action={<Badge tone="info">{slots.length} periods</Badge>}
      />

      {subs.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50/60 p-5">
          <p className="text-[12px] font-bold uppercase tracking-wider text-amber-700">
            Upcoming substitutions
          </p>
          <ul className="mt-2 space-y-1">
            {subs.map((s) => (
              <li key={s.id} className="text-[13px] font-semibold text-ink-700">
                Period {s.period} {s.subject} — {s.substituteTeacher.name} is covering
                {s.reason ? ` (${s.reason})` : ""}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-6">
        {slots.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-ink-400">
                  <th className="px-3 py-2 font-bold">Period</th>
                  {DAYS.map((d) => (
                    <th key={d} className="px-3 py-2 font-bold">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }, (_, i) => i + 1).map((p) => (
                  <tr key={p} className="border-t border-line">
                    <td className="whitespace-nowrap px-3 py-2.5 text-[12px] font-bold text-ink-500">
                      P{p}
                      <span className="block text-[10.5px] font-semibold text-ink-400">
                        {bySlot.get(`Mon-${p}`)?.startTime ?? ""}
                      </span>
                    </td>
                    {DAYS.map((d) => {
                      const s = bySlot.get(`${d}-${p}`);
                      return (
                        <td key={d} className="px-3 py-2.5">
                          {s ? (
                            <div className="rounded-lg bg-brand-50/70 px-2.5 py-2 ring-1 ring-brand-600/10">
                              <p className="text-[12.5px] font-bold text-brand-700">{s.subject}</p>
                              <p className="text-[10.5px] text-ink-500">
                                {s.teacher?.name ?? ""}
                                {s.room ? ` · ${s.room}` : ""}
                              </p>
                            </div>
                          ) : (
                            <span className="block px-2.5 py-2 text-[11.5px] text-ink-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Timetable not published yet"
            hint="Your class teacher will publish the weekly timetable soon."
            icon={<Clock size={20} />}
          />
        )}
      </Card>
    </div>
  );
}
