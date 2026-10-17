import Link from "next/link";
import {
  BookOpen,
  CalendarCheck,
  ClipboardList,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { teacherPulse } from "@/lib/insights";
import { fmtDate, pct } from "@/lib/utils";
import { SubjectBars, TrendArea } from "@/components/charts";
import {
  Avatar,
  Badge,
  Card,
  CardHeader,
  PageHeader,
  StatCard,
} from "@/components/ui";

export const metadata = { title: "Teacher dashboard" };

export default async function TeacherDashboardPage() {
  const session = await requireSession(["TEACHER"]);
  const pulse = await teacherPulse(session.sub);

  const classesLabel = [
    ...new Set(
      pulse.assignments.map(
        (a) => `${a.schoolClass.name} ${a.schoolClass.section}`
      )
    ),
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Namaste, ${session.name.split(" ")[0]}`}
        sub={`${pulse.subjectsTaught.join(", ")} · ${classesLabel.length} classes · ${pulse.studentCount} students`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/teacher/attendance"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_30px_-14px_rgba(79,70,229,.9)] transition hover:bg-brand-700"
            >
              <CalendarCheck size={16} /> Mark attendance
            </Link>
            <Link
              href="/teacher/marks"
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-bold text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
            >
              <ClipboardList size={16} /> Enter marks
            </Link>
            <Link
              href="/teacher/homework"
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-bold text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
            >
              <BookOpen size={16} /> Activities
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Students"
          value={pulse.studentCount}
          hint={classesLabel.join(" · ")}
          icon={<Avatar name={session.name} size="sm" />}
          tone="brand"
        />
        <StatCard
          label="Class average"
          value={pct(pulse.overall)}
          hint="Across your subjects"
          icon={<TrendingUp size={18} />}
          tone={pulse.overall >= 60 ? "success" : "warning"}
        />
        <StatCard
          label="Attendance"
          value={pct(pulse.attendancePct)}
          hint="Your classes, all recorded days"
          icon={<CalendarCheck size={18} />}
          tone={pulse.attendancePct >= 85 ? "success" : "warning"}
        />
        <StatCard
          label="Need attention"
          value={pulse.atRisk.length}
          hint="Students flagged by the system"
          icon={<TriangleAlert size={18} />}
          tone={pulse.atRisk.length ? "danger" : "success"}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Performance trend" sub="Monthly average across your classes" />
          <div className="px-3 pb-5 pt-2">
            <TrendArea
              data={pulse.trend.map((t) => ({ label: t.month, value: t.value }))}
              height={230}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Subject-wise averages" sub="Your teaching subjects" />
          <div className="px-3 pb-5 pt-3">
            <SubjectBars data={pulse.subjects} height={230} />
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Students needing attention"
            sub="Low scores, attendance or overdue work"
            action={<Badge tone="danger">{pulse.atRisk.length} flagged</Badge>}
          />
          <div className="mt-2 px-2 pb-3">
            {pulse.atRisk.slice(0, 6).map((s) => (
              <Link
                key={s.id}
                href={`/students/${s.id}`}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-surface"
              >
                <Avatar name={s.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold text-ink-900">
                    {s.name}{" "}
                    <span className="font-medium text-ink-400">· {s.className}</span>
                  </p>
                  <p className="truncate text-[12px] text-ink-500">
                    {s.reasons.join(" · ")}
                  </p>
                </div>
                <span className="font-display text-sm font-extrabold text-ink-900">
                  {pct(s.avg)}
                </span>
              </Link>
            ))}
            {!pulse.atRisk.length && (
              <p className="px-3 py-6 text-center text-[13px] text-ink-500">
                Everyone in your classes is on track.
              </p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Recent assessments"
            sub="Latest tests recorded in your classes"
          />
          <div className="mt-2 overflow-x-auto px-2 pb-3">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-ink-400">
                  <th className="px-3 py-2 font-bold">Assessment</th>
                  <th className="px-3 py-2 font-bold">Date</th>
                  <th className="px-3 py-2 font-bold">Scores in</th>
                </tr>
              </thead>
              <tbody>
                {pulse.recentAssessmentRows.map((a) => (
                  <tr key={a.id} className="border-t border-line">
                    <td className="px-3 py-2.5">
                      <p className="font-semibold text-ink-900">{a.title}</p>
                      <p className="text-[12px] text-ink-400">
                        {a.subject} · max {a.maxMarks}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 text-ink-600">{fmtDate(a.date)}</td>
                    <td className="px-3 py-2.5">
                      <Badge tone={a.scores.length ? "success" : "warning"}>
                        {a.scores.length} students
                      </Badge>
                    </td>
                  </tr>
                ))}
                {!pulse.recentAssessmentRows.length && (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-ink-500">
                      No assessments yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
