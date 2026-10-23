import Link from "next/link";
import {
  CalendarCheck2,
  GraduationCap,
  HeartHandshake,
  School,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { requireSession } from "@/lib/auth";
import { schoolPulse } from "@/lib/insights";
import { gradeTree, teacherPerformance, schoolWeeklyReport } from "@/lib/admin";
import { db } from "@/lib/db";
import { fmtDate, pct, cn } from "@/lib/utils";
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

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ grade?: string; gsec?: string; agrade?: string; asec?: string }>;
}) {
  await requireSession(["ADMIN"]);
  const sp = await searchParams;
  const [pulse, grades, teachers] = await Promise.all([
    schoolPulse(),
    gradeTree(),
    teacherPerformance(),
  ]);
  const weekReport = await schoolWeeklyReport(teachers);

  const allClasses = await db.schoolClass.findMany({ orderBy: [{ name: "asc" }, { section: "asc" }] });

  // Class comparison: pick grade -> show its sections
  const grade = grades.find((g) => g.name === sp.grade) ?? grades[0];
  const sectionsOfGrade = grade
    ? allClasses
        .filter((c) => c.name === grade.name)
        .map((c) => {
          const found = pulse.classAvgs.find((x) => x.name === `${c.name} ${c.section}`);
          return { name: `Section ${c.section}`, avg: found?.avg ?? 0, full: `${c.name} ${c.section}` };
        })
    : [];

  // Attention: pick grade -> section
  const aGrade = grades.find((g) => g.name === sp.agrade) ?? null;
  const aSections = aGrade ? allClasses.filter((c) => c.name === aGrade.name) : [];
  const activeASection = aSections.find((c) => c.id === sp.asec) ?? null;
  const attention = pulse.atRisk.filter((s) => {
    if (!aGrade) return true;
    const cls = allClasses.find((c) => `${c.name} ${c.section}` === s.className);
    if (!cls || cls.name !== aGrade.name) return false;
    if (activeASection && cls.section !== activeASection.section) return false;
    return true;
  });

  const teacherBars = teachers.map((t) => ({ name: t.name.split(" ")[0], avg: t.score }));

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
          hint={`${pulse.classes} classes · ${teachers.filter((t) => t.complaints > 0).length} with feedback`}
          icon={<Users size={18} />}
          tone="info"
        />
      </div>

      <Card className="mt-5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-gradient-to-r from-brand-50/70 via-white to-mint-50/60 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="rounded-lg bg-brand-600/10 p-1.5 text-brand-600">
              <Sparkles size={16} />
            </span>
            <div>
              <p className="text-[14px] font-extrabold text-ink-900">Weekly school report</p>
              <p className="text-[11.5px] text-ink-500">What&apos;s going on across the school this week</p>
            </div>
          </div>
          <Badge tone={weekReport.source === "ai" ? "brand" : "neutral"}>
            {weekReport.source === "ai" ? "AI-generated" : "Data summary"}
          </Badge>
        </div>
        <div className="grid gap-5 px-5 py-4 lg:grid-cols-4">
          <p className="text-[13.5px] leading-relaxed text-ink-700 lg:col-span-2">{weekReport.summary}</p>
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-mint-600">Highlights</p>
            <ul className="space-y-1 text-[12.5px] text-ink-600">
              {weekReport.highlights.map((h, i) => (
                <li key={i}>• {h}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-600">Watch / act</p>
            <ul className="space-y-1 text-[12.5px] text-ink-600">
              {[...weekReport.concerns, ...weekReport.actions].slice(0, 4).map((c, i) => (
                <li key={i}>• {c}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

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
          <CardHeader
            title="Teacher averages"
            sub="How well each teacher's students are performing (composite score)"
          />
          <div className="px-3 pb-5 pt-3">
            {teacherBars.length ? (
              <SubjectBars data={teacherBars.map((t) => ({ subject: t.name, avg: t.avg }))} />
            ) : (
              <p className="px-5 py-8 text-center text-[13px] text-ink-500">No teachers yet.</p>
            )}
            <div className="mt-3 space-y-1.5 border-t border-line px-2 pt-3">
              {teachers.slice(0, 4).map((t) => (
                <div key={t.id} className="flex items-center justify-between text-[12.5px]">
                  <span className="font-semibold text-ink-700">{t.name}</span>
                  <span className="flex items-center gap-2">
                    {t.complaints > 0 && <Badge tone="danger">{t.complaints} complaint{t.complaints > 1 ? "s" : ""}</Badge>}
                    <Badge tone={t.score >= 75 ? "success" : t.score >= 60 ? "warning" : "danger"}>{t.score}%</Badge>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Class comparison"
            sub="Pick a grade, then compare its sections"
            action={
              <div className="flex flex-wrap gap-1.5">
                {grades.map((g) => (
                  <Link
                    key={g.name}
                    href={`/admin?grade=${encodeURIComponent(g.name)}${sp.gsec ? `&gsec=${encodeURIComponent(sp.gsec)}` : ""}`}
                    className={cn(
                      "rounded-full px-3 py-1 text-[12px] font-bold transition",
                      g.name === grade?.name
                        ? "bg-brand-600 text-white"
                        : "bg-surface text-ink-600 ring-1 ring-line hover:ring-brand-300"
                    )}
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            }
          />
          <div className="px-3 pb-5 pt-3">
            {sectionsOfGrade.length ? (
              <ClassBars data={sectionsOfGrade.map((s) => ({ name: s.name, avg: s.avg }))} />
            ) : (
              <p className="px-5 py-8 text-center text-[13px] text-ink-500">No sections in this grade.</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader
          title="Students needing attention"
          sub="Flagged automatically from marks, attendance and pending work"
          action={
            <div className="flex flex-wrap items-center gap-1.5">
              <Link
                href="/admin?agrade="
                className={cn(
                  "rounded-full px-3 py-1 text-[12px] font-bold transition",
                  !aGrade ? "bg-brand-600 text-white" : "bg-surface text-ink-600 ring-1 ring-line"
                )}
              >
                All
              </Link>
              {grades.map((g) => (
                <Link
                  key={g.name}
                  href={`/admin?agrade=${encodeURIComponent(g.name)}`}
                  className={cn(
                    "rounded-full px-3 py-1 text-[12px] font-bold transition",
                    g.name === aGrade?.name
                      ? "bg-brand-600 text-white"
                      : "bg-surface text-ink-600 ring-1 ring-line hover:ring-brand-300"
                  )}
                >
                  {g.name}
                </Link>
              ))}
            </div>
          }
        />
        {aGrade && (
          <div className="flex flex-wrap gap-1.5 border-t border-line px-5 py-3">
            <Link
              href={`/admin?agrade=${encodeURIComponent(aGrade.name)}`}
              className={cn(
                "rounded-full px-3 py-1 text-[12px] font-bold transition",
                !activeASection ? "bg-ink-900 text-white" : "bg-surface text-ink-600 ring-1 ring-line"
              )}
            >
              All sections
            </Link>
            {aSections.map((c) => (
              <Link
                key={c.id}
                href={`/admin?agrade=${encodeURIComponent(aGrade.name)}&asec=${c.id}`}
                className={cn(
                  "rounded-full px-3 py-1 text-[12px] font-bold transition",
                  c.id === activeASection?.id
                    ? "bg-ink-900 text-white"
                    : "bg-surface text-ink-600 ring-1 ring-line hover:ring-brand-300"
                )}
              >
                Section {c.section}
              </Link>
            ))}
          </div>
        )}
        <div className="mt-1 overflow-x-auto px-2 pb-3">
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
              {attention.slice(0, 10).map((s) => (
                <tr key={s.id} className="border-t border-line transition hover:bg-surface/70">
                  <td className="px-4 py-3">
                    <Link href={`/students/${s.id}`} className="flex items-center gap-3 font-bold text-ink-900 hover:text-brand-700">
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
                        <Badge key={r} tone="danger">{r}</Badge>
                      ))}
                    </span>
                  </td>
                </tr>
              ))}
              {!attention.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-ink-500">
                    No students flagged in this view — everyone is on track.
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
