import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  CalendarCheck2,
  ClipboardCheck,
  FileQuestion,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { studentPulse } from "@/lib/insights";
import { ensureRecommendations } from "@/lib/ai";
import { fmtDate, pct, toneForPct } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { AttendanceDonut, SubjectBars, TrendArea } from "@/components/charts";
import { PracticeQuizButton } from "@/components/teacher-forms";
import { refreshRecommendationsAction } from "@/app/actions/recommend";
import { nextBestAction } from "@/lib/next-action";
import { StudentVoiceCard, FeedbackPrincipalCard } from "@/components/student-voice";
import {
  Avatar,
  Badge,
  Card,
  CardHeader,
  Delta,
  PageHeader,
  Progress,
  StatCard,
} from "@/components/ui";

export const metadata = { title: "Student dashboard" };

const NOW = Date.now();

const REC_TONE: Record<string, "brand" | "danger" | "warning" | "success" | "info"> = {
  SUBJECT_SUPPORT: "warning",
  DECLINE: "danger",
  ATTENDANCE: "danger",
  HOMEWORK: "warning",
  STRENGTH: "success",
  QUIZ_SUGGESTION: "brand",
  ON_TRACK: "success",
};

const REC_LABEL: Record<string, string> = {
  SUBJECT_SUPPORT: "Support",
  DECLINE: "Trend",
  ATTENDANCE: "Attendance",
  HOMEWORK: "Activity",
  STRENGTH: "Strength",
  QUIZ_SUGGESTION: "AI quiz",
  ON_TRACK: "Status",
};

export default async function StudentDashboardPage() {
  const session = await requireSession(["STUDENT"]);
  const base = await db.student.findUnique({
    where: { userId: session.sub },
    select: { id: true, classId: true },
  });
  if (!base) notFound();

  const [pulse, recommendations, quizAttempts, availableQuizzes] = await Promise.all([
    studentPulse(base.id),
    ensureRecommendations(base.id),
    db.quizAttempt.findMany({
      where: { studentId: base.id },
      include: { quiz: { select: { title: true, subject: true } } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    db.quiz.count({ where: { classId: base.classId } }),
  ]);
  if (!pulse) notFound();

  const nba = await nextBestAction(base.id);
  const pendingCount = pulse.pendingHw.length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Hi, ${session.name.split(" ")[0]}`}
        sub={`${pulse.student.schoolClass.name} ${pulse.student.schoolClass.section} · Roll ${pulse.student.rollNo} · ${pulse.student.schoolClass.board} · ${pulse.student.schoolClass.year}`}
        action={
          <div className="flex gap-2">
            <Link
              href="/student/plan"
              className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_30px_-12px_rgba(79,70,229,.7)] transition hover:bg-brand-700"
            >
              My learning plan
            </Link>
            <Link
              href={`/students/${pulse.student.id}`}
              className="rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-bold text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
            >
              My full profile
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Overall average"
          value={pct(pulse.overall)}
          hint={
            <span className="flex items-center gap-2">
              <Delta value={pulse.delta} /> vs earlier tests
            </span>
          }
          icon={<TrendingUp size={18} />}
          tone={pulse.overall >= 60 ? "success" : "warning"}
        />
        <StatCard
          label="Class rank"
          value={`${pulse.rank}/${pulse.totalInClass}`}
          hint="Based on all recorded assessments"
          icon={<ClipboardCheck size={18} />}
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
          label="Activities done"
          value={`${pulse.homeworkDone}/${pulse.homeworkTotal}`}
          hint={pendingCount ? `${pendingCount} pending — submit soon` : "All caught up"}
          icon={<BookOpen size={18} />}
          tone={pendingCount ? "warning" : "success"}
        />
      </div>

      <Card className="mt-5 overflow-hidden border-brand-200/70 bg-gradient-to-r from-brand-50/70 via-white to-white">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-brand-600 p-2 text-white shadow-[0_8px_20px_-8px_rgba(79,70,229,.8)]">
              <Sparkles size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600">
                Next best action · {nba.reason}
              </p>
              <p className="mt-0.5 font-display text-[15.5px] font-extrabold text-ink-900">
                {nba.title}
              </p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-ink-600">{nba.detail}</p>
            </div>
          </div>
          <Link
            href={nba.cta.href}
            className="shrink-0 rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
          >
            {nba.cta.label} →
          </Link>
        </div>
      </Card>

      <Card className="mt-5">
        <CardHeader
          title="AI recommendations"
          sub="Generated from your marks, attendance, activities and syllabus context"
          action={
            <form action={refreshRecommendationsAction.bind(null, pulse.student.id)}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 text-[12.5px] font-bold text-ink-600 transition hover:border-brand-300 hover:text-brand-700"
              >
                <RefreshCw size={13} /> Re-analyze
              </button>
            </form>
          }
        />
        <div className="grid gap-3 p-5 pt-4 md:grid-cols-2">
          {recommendations.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-line bg-surface/60 p-4 transition hover:bg-surface"
            >
              <div className="flex items-center justify-between gap-2">
                <Badge tone={REC_TONE[r.kind] ?? "neutral"}>
                  <Sparkles size={11} /> {REC_LABEL[r.kind] ?? r.kind}
                </Badge>
                {r.context && <span className="text-[11.5px] font-bold text-ink-400">{r.context}</span>}
              </div>
              <p className="mt-2 font-display text-[14.5px] font-extrabold text-ink-900">
                {r.title}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-600">{r.body}</p>
            </div>
          ))}
          {!recommendations.length && (
            <p className="text-[13px] text-ink-500 md:col-span-2">
              No recommendations yet — complete a few assessments first.
            </p>
          )}
        </div>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Progress over time"
            sub="Every test and quiz result feeds back into this trend"
            action={<Badge tone={pulse.delta >= 0 ? "success" : "danger"}><Delta value={pulse.delta} /></Badge>}
          />
          <div className="px-3 pb-5 pt-2">
            <TrendArea data={pulse.trendSeries} height={240} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Subject pulse" sub="Average across assessments" />
          <div className="px-3 pb-4 pt-3">
            <SubjectBars data={pulse.subjects} height={210} />
          </div>
          <div className="space-y-2.5 border-t border-line px-5 py-4">
            {pulse.subjects.slice(0, 3).map((s) => (
              <div key={s.subject}>
                <div className="mb-1 flex justify-between text-[12.5px]">
                  <span className="font-semibold text-ink-700">{s.subject}</span>
                  <span className={cn("font-bold", toneForPct(s.avg))}>{pct(s.avg)}</span>
                </div>
                <Progress value={s.avg} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader title="Attendance" sub="All recorded days" />
          <div className="px-6 pb-6 pt-2">
            <AttendanceDonut pct={pulse.attendancePct} />
            {pulse.recentAbsents.length > 0 && (
              <p className="mt-2 text-center text-[12.5px] text-ink-500">
                Recent absences:{" "}
                {pulse.recentAbsents
                  .map((a) => fmtDate(a.date))
                  .slice(0, 3)
                  .join(", ")}
              </p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Pending activities"
            sub="Homework, assignments & projects"
            action={
              <Link href="/student/homework" className="text-[13px] font-bold text-brand-600 hover:text-brand-700">
                View all →
              </Link>
            }
          />
          <ul className="space-y-2 p-4">
            {pulse.pendingHw.slice(0, 4).map((s) => {
              const overdue = s.homework.dueDate.getTime() < NOW;
              return (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-bold text-ink-900">
                      {s.homework.title}
                    </p>
                    <p className="text-[11.5px] text-ink-500">
                      {s.homework.subject} · due {fmtDate(s.homework.dueDate)}
                    </p>
                  </div>
                  <Badge tone={overdue ? "danger" : "warning"}>
                    {overdue ? "Overdue" : "Pending"}
                  </Badge>
                </li>
              );
            })}
            {!pulse.pendingHw.length && (
              <li className="py-6 text-center text-[13px] text-ink-500">
                Nothing pending — great going! 🎯
              </li>
            )}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="AI quizzes"
            sub="Personalised practice for your focus areas"
            action={
              <Link href="/student/quizzes" className="text-[13px] font-bold text-brand-600 hover:text-brand-700">
                All quizzes →
              </Link>
            }
          />
          <div className="p-5 pt-3">
            <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 p-4 text-white">
              <p className="flex items-center gap-2 font-display text-[14.5px] font-extrabold">
                <FileQuestion size={16} /> {availableQuizzes} quizzes available
              </p>
              <p className="mt-1 text-[12.5px] text-white/75">
                Quiz scores are added to your progress history automatically.
              </p>
              <div className="mt-3">
                <PracticeQuizButton />
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {quizAttempts.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 text-[13px]">
                  <span className="truncate text-ink-700">{a.quiz.title}</span>
                  <span className={`font-extrabold ${a.score / a.total >= 0.6 ? "text-mint-600" : "text-rose-600"}`}>
                    {a.score}/{a.total}
                  </span>
                </li>
              ))}
              {!quizAttempts.length && (
                <li className="text-[12.5px] text-ink-500">No quiz attempts yet.</li>
              )}
            </ul>
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <StudentVoiceCard />
        <FeedbackPrincipalCard />
      </div>

      <Card className="mt-5">
        <CardHeader title="Recent results" sub="Latest assessments on your record" />
        <div className="overflow-x-auto px-2 pb-3 pt-2">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-ink-400">
                <th className="px-4 py-2 font-bold">Assessment</th>
                <th className="px-4 py-2 font-bold">Subject</th>
                <th className="px-4 py-2 font-bold">Date</th>
                <th className="px-4 py-2 font-bold">Score</th>
                <th className="px-4 py-2 font-bold">%</th>
              </tr>
            </thead>
            <tbody>
              {pulse.recentRows.map((r, i) => {
                const p = (r.marks / r.max) * 100;
                return (
                  <tr key={i} className="border-t border-line">
                    <td className="px-4 py-2.5 font-semibold text-ink-900">{r.title}</td>
                    <td className="px-4 py-2.5 text-ink-600">{r.subject}</td>
                    <td className="px-4 py-2.5 text-ink-500">{fmtDate(r.date)}</td>
                    <td className="px-4 py-2.5 font-bold text-ink-900">
                      {r.marks} / {r.max}
                    </td>
                    <td className={`px-4 py-2.5 font-extrabold ${toneForPct(p)}`}>{pct(p)}</td>
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
