import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CalendarCheck2,
  Newspaper,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { studentPulse } from "@/lib/insights";
import { ensureRecommendations } from "@/lib/ai";
import { fmtDate, pct } from "@/lib/utils";
import { SubjectBars, TrendArea } from "@/components/charts";
import { refreshRecommendationsAction } from "@/app/actions/recommend";
import {
  Avatar,
  Badge,
  Card,
  CardHeader,
  Delta,
  PageHeader,
  StatCard,
} from "@/components/ui";

export const metadata = { title: "Parent overview" };

const REC_TONE: Record<string, "brand" | "danger" | "warning" | "success"> = {
  SUBJECT_SUPPORT: "warning",
  DECLINE: "danger",
  ATTENDANCE: "danger",
  HOMEWORK: "warning",
  STRENGTH: "success",
  QUIZ_SUGGESTION: "brand",
  ON_TRACK: "success",
};

export default async function ParentDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>;
}) {
  const session = await requireSession(["PARENT"]);
  const { child } = await searchParams;

  const links = await db.parentLink.findMany({
    where: { parentId: session.sub },
    include: {
      student: {
        include: {
          user: { select: { name: true } },
          schoolClass: true,
        },
      },
    },
  });
  if (!links.length) notFound();

  const active =
    links.find((l) => l.student.id === child)?.student ?? links[0].student;

  const [pulse, recommendations, recentScores, pendingHw] = await Promise.all([
    studentPulse(active.id),
    ensureRecommendations(active.id),
    db.score.findMany({
      where: { studentId: active.id },
      include: { assessment: true },
      orderBy: { assessment: { date: "desc" } },
      take: 5,
    }),
    db.homeworkSubmission.count({
      where: { studentId: active.id, status: "PENDING" },
    }),
  ]);
  if (!pulse) notFound();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`${session.name.split(" ")[0]}'s child updates`}
        sub="Automatic progress updates — no need to wait for the next parent-teacher meeting."
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/parent/report"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
            >
              <Newspaper size={16} /> Weekly report
            </Link>
            <Link
              href={`/students/${active.id}`}
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-bold text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
            >
              Full profile <ArrowRight size={15} />
            </Link>
          </div>
        }
      />

      {links.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {links.map((l) => (
            <Link
              key={l.id}
              href={`/parent?child=${l.student.id}`}
              className={
                l.student.id === active.id
                  ? "inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-[13.5px] font-bold text-white"
                  : "inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-[13.5px] font-bold text-ink-600 transition hover:border-brand-300"
              }
            >
              <Avatar name={l.student.user.name} size="sm" className="h-6 w-6 text-[10px]" />
              {l.student.user.name}
            </Link>
          ))}
        </div>
      )}

      <Card className="mb-5 p-5">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={active.user.name} size="lg" />
          <div className="min-w-0">
            <p className="font-display text-lg font-extrabold text-ink-900">
              {active.user.name}
            </p>
            <p className="text-[13px] text-ink-500">
              {active.schoolClass.name} {active.schoolClass.section} · Roll{" "}
              {active.rollNo} · {active.schoolClass.board} · Admission{" "}
              {active.admissionNo}
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            <Badge tone={pendingHw ? "warning" : "success"}>
              {pendingHw} pending activities
            </Badge>
            <form action={refreshRecommendationsAction.bind(null, active.id)}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 text-[12.5px] font-bold text-ink-600 transition hover:border-brand-300 hover:text-brand-700"
              >
                <RefreshCw size={13} /> Re-analyze
              </button>
            </form>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Overall average"
          value={pct(pulse.overall)}
          hint={
            <span className="flex items-center gap-2">
              <Delta value={pulse.delta} /> recent trend
            </span>
          }
          icon={<TrendingUp size={18} />}
          tone={pulse.overall >= 60 ? "success" : "warning"}
        />
        <StatCard
          label="Class rank"
          value={`${pulse.rank} of ${pulse.totalInClass}`}
          hint="Among classmates"
          icon={<TrendingUp size={18} />}
          tone="brand"
        />
        <StatCard
          label="Attendance"
          value={pct(pulse.attendancePct)}
          hint={`${Math.round(pulse.recentAttendance)}% in last 30 days`}
          icon={<CalendarCheck2 size={18} />}
          tone={pulse.attendancePct >= 75 ? "success" : "danger"}
        />
        <StatCard
          label="Activities submitted"
          value={`${pulse.homeworkDone}/${pulse.homeworkTotal}`}
          hint={pendingHw ? `${pendingHw} still pending` : "Everything submitted"}
          icon={<Newspaper size={18} />}
          tone={pendingHw ? "warning" : "success"}
        />
      </div>

      <Card className="mt-5">
        <CardHeader
          title="What needs attention"
          sub="Automatic analysis of marks, attendance and submitted work"
        />
        <div className="grid gap-3 p-5 pt-4 md:grid-cols-2">
          {recommendations.map((r) => (
            <div key={r.id} className="rounded-2xl border border-line bg-surface/60 p-4">
              <Badge tone={REC_TONE[r.kind] ?? "warning"}>
                {r.kind.replaceAll("_", " ").toLowerCase()}
              </Badge>
              <p className="mt-2 font-display text-[14.5px] font-extrabold text-ink-900">
                {r.title}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-600">{r.body}</p>
            </div>
          ))}
          {!recommendations.length && (
            <p className="text-[13px] text-ink-500 md:col-span-2">
              No recommendations yet.
            </p>
          )}
        </div>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Progress over time"
            sub="Tests and quiz results across the year"
            action={<Badge tone={pulse.delta >= 0 ? "success" : "danger"}><Delta value={pulse.delta} /></Badge>}
          />
          <div className="px-3 pb-5 pt-2">
            <TrendArea data={pulse.trendSeries} height={240} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Subject-wise performance" sub="Average scores" />
          <div className="px-3 pb-5 pt-3">
            <SubjectBars data={pulse.subjects} height={230} />
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader
          title="Latest results"
          sub="Most recent assessments recorded"
          action={
            <Link href="/parent/report" className="text-[13px] font-bold text-brand-600">
              Weekly report →
            </Link>
          }
        />
        <div className="overflow-x-auto px-2 pb-3 pt-2">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-ink-400">
                <th className="px-4 py-2 font-bold">Assessment</th>
                <th className="px-4 py-2 font-bold">Subject</th>
                <th className="px-4 py-2 font-bold">Date</th>
                <th className="px-4 py-2 font-bold">Score</th>
              </tr>
            </thead>
            <tbody>
              {recentScores.map((s) => {
                const p = (s.marks / s.assessment.maxMarks) * 100;
                return (
                  <tr key={s.id} className="border-t border-line">
                    <td className="px-4 py-2.5 font-semibold text-ink-900">
                      {s.assessment.title}
                    </td>
                    <td className="px-4 py-2.5 text-ink-600">{s.assessment.subject}</td>
                    <td className="px-4 py-2.5 text-ink-500">{fmtDate(s.assessment.date)}</td>
                    <td className="px-4 py-2.5">
                      <span className="font-extrabold text-ink-900">
                        {s.marks} / {s.assessment.maxMarks}
                      </span>
                      <span
                        className={`ml-2 text-[12.5px] font-bold ${
                          p >= 75 ? "text-mint-600" : p >= 50 ? "text-accent-600" : "text-rose-600"
                        }`}
                      >
                        {Math.round(p)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
