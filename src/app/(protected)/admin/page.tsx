import Link from "next/link";
import {
  CalendarCheck2,
  GraduationCap,
  HeartHandshake,
  School,
  TrendingUp,
  Users,
} from "lucide-react";
import { requireSession } from "@/lib/auth";
import { schoolPulse } from "@/lib/insights";
import { fmtDate, pct } from "@/lib/utils";
import {
  AttendanceDonut,
  ClassBars,
  SubjectBars,
  TrendArea,
} from "@/components/charts";
import {
  Avatar,
  Badge,
  Card,
  CardHeader,
  PageHeader,
  StatCard,
} from "@/components/ui";

export const metadata = { title: "Overview" };

export default async function AdminOverviewPage() {
  await requireSession(["ADMIN"]);
  const pulse = await schoolPulse();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="School overview"
        sub="Vidya Niketan Public School · Academic year 2026-27 · Updated live"
        action={
          <Link
            href="/counseling"
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-bold text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
          >
            <HeartHandshake size={16} /> Counseling center
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Students"
          value={pulse.students}
          hint="Across 5 classes"
          icon={<GraduationCap size={18} />}
          tone="brand"
        />
        <StatCard
          label="Overall average"
          value={pct(pulse.overall)}
          hint="All subjects, all assessments"
          icon={<TrendingUp size={18} />}
          tone={pulse.overall >= 60 ? "success" : "warning"}
        />
        <StatCard
          label="Attendance"
          value={pct(pulse.attendancePct)}
          hint="School-wide, Aug–Oct"
          icon={<CalendarCheck2 size={18} />}
          tone={pulse.attendancePct >= 85 ? "success" : "warning"}
        />
        <StatCard
          label="Teachers"
          value={pulse.teachers}
          hint={`${pulse.classes} classes · ${pulse.atRisk.length} need attention`}
          icon={<Users size={18} />}
          tone="info"
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Performance trend"
            sub="School-wide average by month"
            action={<Badge tone="brand"><TrendingUp size={12} /> 2026-27</Badge>}
          />
          <div className="px-3 pb-5 pt-2">
            <TrendArea
              data={pulse.monthly.map((m) => ({ label: m.month, value: m.value }))}
              height={240}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Attendance pulse" sub="All recorded days" />
          <div className="px-6 pb-6 pt-2">
            <AttendanceDonut pct={pulse.attendancePct} />
            <div className="mt-3 space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-ink-500">Requirement</span>
                <span className="font-bold text-ink-800">75% minimum</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Classes below target</span>
                <span className="font-bold text-ink-800">
                  {pulse.atRisk.filter((s) => s.attendance < 75).length} students
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Subject-wise averages" sub="Across all classes" />
          <div className="px-3 pb-5 pt-3">
            <SubjectBars data={pulse.subjects} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Class comparison" sub="Average score per class" />
          <div className="px-3 pb-5 pt-3">
            <ClassBars data={pulse.classAvgs} />
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader
          title="Students needing attention"
          sub="Flagged automatically from marks, attendance and pending work"
          action={
            <Link
              href="/admin/students"
              className="text-[13px] font-bold text-brand-600 hover:text-brand-700"
            >
              View all students →
            </Link>
          }
        />
        <div className="mt-3 overflow-x-auto px-2 pb-3">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-ink-400">
                <th className="px-4 py-2 font-bold">Student</th>
                <th className="px-4 py-2 font-bold">Class</th>
                <th className="px-4 py-2 font-bold">Average</th>
                <th className="px-4 py-2 font-bold">Attendance</th>
                <th className="px-4 py-2 font-bold">Why flagged</th>
              </tr>
            </thead>
            <tbody>
              {pulse.atRisk.slice(0, 8).map((s) => (
                <tr
                  key={s.id}
                  className="border-t border-line transition hover:bg-surface/70"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/students/${s.id}`}
                      className="flex items-center gap-3 font-bold text-ink-900 hover:text-brand-700"
                    >
                      <Avatar name={s.name} size="sm" />
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{s.className}</td>
                  <td className="px-4 py-3 font-bold text-ink-900">{pct(s.avg)}</td>
                  <td className="px-4 py-3 font-bold text-ink-900">{pct(s.attendance)}</td>
                  <td className="px-4 py-3">
                    <span className="flex flex-wrap gap-1.5">
                      {s.reasons.map((r) => (
                        <Badge key={r} tone="danger">
                          {r}
                        </Badge>
                      ))}
                    </span>
                  </td>
                </tr>
              ))}
              {!pulse.atRisk.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-ink-500">
                    No students flagged — everyone is on track.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="mt-6 flex items-center gap-2 text-[12.5px] text-ink-400">
        <School size={14} /> Data collected {fmtDate(new Date())} · marks,
        attendance, homework and counseling activity
      </p>
    </div>
  );
}
