import { Clock, Plus, Trash2 } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { SUBJECTS } from "@/lib/question-bank";
import {
  deleteTimetableSlotAction,
  upsertTimetableSlotAction,
} from "@/app/actions/erp";
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

export const metadata = { title: "Timetable" };

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function AdminTimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ cls?: string }>;
}) {
  await requireSession(["ADMIN"]);
  const { cls } = await searchParams;
  const classes = await db.schoolClass.findMany({ orderBy: { name: "asc" } });
  const classId = classes.find((c) => c.id === cls)?.id ?? classes[0]?.id;

  const slots = classId
    ? await db.timetableSlot.findMany({
        where: { classId },
        include: { teacher: { select: { name: true } } },
        orderBy: { period: "asc" },
      })
    : [];
  const teachers = await db.user.findMany({
    where: { role: "TEACHER" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, title: true },
  });
  const bySlot = new Map(slots.map((s) => [`${s.day}-${s.period}`, s]));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Timetable"
        sub="Class periods for the week — assign subject, room and teacher. One slot per class, day and period."
        action={
          <Badge tone="info">
            {slots.length} slots
          </Badge>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="p-6">
          <form method="get" className="mb-4 flex flex-wrap items-end gap-3">
            <div className="min-w-[200px]">
              <label className={labelCls} htmlFor="tt-cls">Class</label>
              <select id="tt-cls" name="cls" defaultValue={classId} className={inputCls}>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.section}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="outline">
              <Clock size={15} /> Show timetable
            </Button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-ink-400">
                  <th className="px-3 py-2 font-bold">Period</th>
                  {DAYS.map((day) => (
                    <th key={day} className="px-3 py-2 font-bold">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }, (_, i) => i + 1).map((period) => (
                  <tr key={period} className="border-t border-line align-top">
                    <td className="whitespace-nowrap px-3 py-2.5 text-[12px] font-bold text-ink-500">
                      P{period}
                      <span className="block text-[10.5px] font-semibold text-ink-400">
                        {bySlot.get(`Mon-${period}`)?.startTime ?? "08:00"}
                      </span>
                    </td>
                    {DAYS.map((day) => {
                      const slot = bySlot.get(`${day}-${period}`);
                      return (
                        <td key={day} className="px-3 py-2.5">
                          {slot ? (
                            <div className="group rounded-lg bg-brand-50/70 px-2.5 py-2 ring-1 ring-brand-600/10">
                              <p className="text-[12.5px] font-bold text-brand-700">
                                {slot.subject}
                              </p>
                              <p className="text-[10.5px] text-ink-500">
                                {slot.teacher?.name ?? "—"}
                                {slot.room ? ` · ${slot.room}` : ""}
                              </p>
                              <form action={deleteTimetableSlotAction.bind(null, slot.id)} className="mt-1 hidden group-hover:block">
                                <button
                                  type="submit"
                                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-rose-500 hover:text-rose-600"
                                >
                                  <Trash2 size={10} /> remove
                                </button>
                              </form>
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
        </Card>

        <Card className="h-fit p-6">
          <CardHeader
            title="Set a period"
            sub="Fills the slot, or updates it if one already exists."
            className="!px-0 !pt-0"
          />
          <form action={upsertTimetableSlotAction} className="mt-4 space-y-3">
            <div>
              <label className={labelCls} htmlFor="tt-class">Class</label>
              <select id="tt-class" name="classId" defaultValue={classId} className={inputCls} required>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="tt-day">Day</label>
                <select id="tt-day" name="day" className={inputCls} required>
                  {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="tt-period">Period</label>
                <select id="tt-period" name="period" className={inputCls} required>
                  {Array.from({ length: 8 }, (_, i) => i + 1).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls} htmlFor="tt-subject">Subject</label>
              <select id="tt-subject" name="subject" className={inputCls} required>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="tt-teacher">Teacher</label>
              <select id="tt-teacher" name="teacherId" className={inputCls} defaultValue="">
                <option value="">— none —</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} · {t.title ?? "Teacher"}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls} htmlFor="tt-start">Start</label>
                <input id="tt-start" name="startTime" defaultValue="08:00" className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor="tt-end">End</label>
                <input id="tt-end" name="endTime" defaultValue="08:45" className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor="tt-room">Room</label>
                <input id="tt-room" name="room" placeholder="101" maxLength={20} className={inputCls} />
              </div>
            </div>
            <Button type="submit">
              <Plus size={15} /> Save slot
            </Button>
          </form>
        </Card>
      </div>

      {!slots.length && (
        <Card className="mt-6">
          <EmptyState
            title="No slots for this class yet"
            hint="Use the form to add the first period of the week."
            icon={<Clock size={20} />}
          />
        </Card>
      )}
    </div>
  );
}
