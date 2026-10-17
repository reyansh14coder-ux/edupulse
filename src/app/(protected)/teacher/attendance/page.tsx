import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { isoDate, todayIST } from "@/lib/utils";
import { AttendanceMarking } from "@/components/attendance-marking";
import { Card, PageHeader, inputCls, labelCls } from "@/components/ui";
import { cn } from "@/lib/utils";

export const metadata = { title: "Attendance" };

export default async function TeacherAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; date?: string }>;
}) {
  const session = await requireSession(["TEACHER"]);
  const sp = await searchParams;

  const assignments = await db.teacherAssignment.findMany({
    where: { teacherId: session.sub },
    include: { schoolClass: true },
    orderBy: { schoolClass: { name: "asc" } },
  });
  const classIds = [...new Set(assignments.map((a) => a.classId))];
  const classes = await db.schoolClass.findMany({
    where: { id: { in: classIds } },
    orderBy: { name: "asc" },
  });
  if (!classes.length) notFound();

  const classId = classes.some((c) => c.id === sp.class) ? sp.class! : classes[0].id;
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : isoDate(todayIST());

  const students = await db.student.findMany({
    where: { classId },
    orderBy: { rollNo: "asc" },
    include: {
      user: { select: { name: true } },
      attendance: { where: { date: new Date(date) } },
    },
  });

  const cls = classes.find((c) => c.id === classId)!;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Attendance"
        sub="Marking is saved straight to each student's record and factored into progress analysis."
      />

      <Card className="mb-5 p-4">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div>
            <label className={labelCls} htmlFor="class">Class</label>
            <select id="class" name="class" defaultValue={classId} className={cn(inputCls, "w-52")}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.section}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="date">Date</label>
            <input
              id="date"
              name="date"
              type="date"
              defaultValue={date}
              className={cn(inputCls, "w-48")}
            />
          </div>
          <button
            type="submit"
            className="rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-bold text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
          >
            Load
          </button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <h3 className="font-display text-[15px] font-bold text-ink-900">
            {cls.name} {cls.section} · {new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </h3>
          <p className="text-[12.5px] text-ink-500">
            {students.length} students on roll
          </p>
        </div>
        <AttendanceMarking
          classId={classId}
          date={date}
          students={students.map((s) => ({
            id: s.id,
            name: s.user.name,
            roll: s.rollNo,
            status: s.attendance[0]?.status ?? null,
          }))}
        />
      </Card>
    </div>
  );
}
