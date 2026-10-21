import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarCheck2,
  HeartHandshake,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { studentPulse } from "@/lib/insights";
import { ensureRecommendations, draftPlan } from "@/lib/ai";
import { logAudit } from "@/lib/audit";
import { planFormAction } from "@/app/actions/plan";
import { fmtDate, pct } from "@/lib/utils";
import { AttendanceDonut, SubjectBars, TrendArea } from "@/components/charts";
import { refreshRecommendationsAction } from "@/app/actions/recommend";
import { InterventionPanel } from "@/components/intervention-panel";
import {
  Avatar,
  Badge,
  Card,
  CardHeader,
  Delta,
  PageHeader,
  ScoreRing,
  StatCard,
  inputCls,
} from "@/components/ui";

export const metadata = { title: "Student profile" };

const REC_TONE: Record<string, "brand" | "danger" | "warning" | "success"> = {
  SUBJECT_SUPPORT: "warning",
  DECLINE: "danger",
  ATTENDANCE: "danger",
  HOMEWORK: "warning",
  STRENGTH: "success",
  QUIZ_SUGGESTION: "brand",
  ON_TRACK: "success",
};

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession(["ADMIN", "TEACHER", "STUDENT", "PARENT"]);
  const { id } = await params;

  const student = await db.student.findUnique({
    where: { id },
    include: {
      user: true,
      schoolClass: true,
      parentLinks: { include: { parent: { select: { name: true, email: true } } } },
    },
  });
  if (!student) notFound();

  if (session.role === "STUDENT") {
    const mine = await db.student.findUnique({
      where: { userId: session.sub },
      select: { id: true },
    });
    if (mine?.id !== id) notFound();
  }
  if (session.role === "PARENT") {
    const link = await db.parentLink.findFirst({
      where: { parentId: session.sub, studentId: id },
    });
    if (!link) notFound();
  }
  if (session.role === "TEACHER") {
    const teaches = await db.teacherAssignment.findFirst({
      where: { teacherId: session.sub, classId: student.schoolClass.id },
      select: { id: true },
    });
    if (!teaches) notFound();
  }

  const [pulse, recommendations, attempts, activities, assessments, guidance, sessions, interventions] =
    await Promise.all([
      studentPulse(id),
      ensureRecommendations(id),
      db.quizAttempt.findMany({
        where: { studentId: id },
        include: { quiz: { select: { title: true, subject: true } } },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      db.homeworkSubmission.findMany({
        where: { studentId: id },
        include: { homework: { select: { title: true, subject: true, kind: true, dueDate: true } } },
        orderBy: { homework: { dueDate: "desc" } },
        take: 8,
      }),
      db.score.findMany({
        where: { studentId: id },
        include: { assessment: true },
        orderBy: { assessment: { date: "desc" } },
        take: 12,
      }),
      db.guidanceNote.findMany({
        where: { studentId: id },
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.counselingSession.findMany({
        where: { studentId: id },
        include: { counselor: { select: { name: true } } },
        orderBy: { scheduledFor: "desc" },
        take: 5,
      }),
      db.studentIntervention.findMany({
        where: { studentId: id },
        include: { createdBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);
  if (!pulse) notFound();

  if (session.role !== "STUDENT") {
    await logAudit("VIEW_PROGRESS", {
      subject: student.user.name,
      detail: `${session.role} opened the student progress profile`,
    });
  }

  const canPlan =
    session.role === "TEACHER" || session.role === "ADMIN";

  const planDefaults = new Map<string, string>();
  if (canPlan) {
    for (const r of recommendations) {
      planDefaults.set(r.id, r.plan ?? (await draftPlan(r)));
    }
  }

  const backHref =
    session.role === "ADMIN"
      ? "/admin/students"
      : session.role === "TEACHER"
        ? "/teacher"
        : session.role === "PARENT"
          ? "/parent"
          : "/student";

  return (
    <div className="animate-fade-in">
      <Link
        href={backHref}
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-500 transition hover:text-brand-600"
      >
        <ArrowLeft size={14} /> Back
      </Link>

      <Card className="mb-5 p-6">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar name={student.user.name} size="xl" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">
                {student.user.name}
              </h1>
              <Badge tone="brand">{student.schoolClass.board}</Badge>
              {pulse.rank <= 3 && <Badge tone="success">Rank {pulse.rank} in class</Badge>}
            </div>
            <p className="mt-1 text-[13.5px] text-ink-500">
              {student.schoolClass.name} {student.schoolClass.section} · Roll{" "}
              {student.rollNo} · {student.admissionNo} · {student.schoolClass.year}
            </p>
            <p className="mt-0.5 text-[13px] text-ink-500">
              Parents:{" "}
              {student.parentLinks.map((p) => p.parent.name).join(", ") || "not linked"}
            </p>
          </div>
          <div className="ml-auto flex flex-col items-center">
            <ScoreRing value={pulse.overall} label="overall" />
            <span className="mt-1 text-[12px] font-bold text-ink-400">
              Rank {pulse.rank}/{pulse.totalInClass}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Average"
          value={pct(pulse.overall)}
          hint={<Delta value={pulse.delta} />}
          icon={<TrendingUp size={18} />}
          tone={pulse.overall >= 60 ? "success" : "warning"}
        />
        <StatCard
          label="Attendance"
          value={pct(pulse.attendancePct)}
          hint={`${Math.round(pulse.recentAttendance)}% last 30 days`}
          icon={<CalendarCheck2 size={18} />}
          tone={pulse.attendancePct >= 75 ? "success" : "danger"}
        />
        <StatCard
          label="Activities"
          value={`${pulse.homeworkDone}/${pulse.homeworkTotal}`}
          hint={`${pulse.overdueHw.length} overdue`}
          icon={<BookOpen size={18} />}
          tone={pulse.overdueHw.length ? "warning" : "success"}
        />
        <StatCard
          label="Quiz attempts"
          value={attempts.length}
          hint="Added to progress history"
          icon={<Sparkles size={18} />}
          tone="brand"
        />
      </div>

      <Card className="mt-5">
        <CardHeader
          title="Attention flags & AI recommendations"
          sub="Generated from marks, attendance, activities and syllabus context"
          action={
            <form action={refreshRecommendationsAction.bind(null, student.id)}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 text-[12.5px] font-bold text-ink-600 transition hover:border-brand-300 hover:text-brand-700"
              >
                <Sparkles size={13} /> Re-analyze
              </button>
            </form>
          }
        />
        <div className="grid gap-3 p-5 pt-4 lg:grid-cols-2">
          {pulse.flags.map((f, i) => (
            <div
              key={i}
              className={`rounded-xl border px-4 py-3 text-[13.5px] font-semibold ${
                f.severity === "high"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : f.severity === "medium"
                    ? "border-accent-200 bg-accent-50/60 text-accent-600"
                    : f.severity === "good"
                      ? "border-mint-200 bg-mint-500/10 text-mint-600"
                      : "border-line bg-surface text-ink-600"
              }`}
            >
              {f.message}
            </div>
          ))}
        </div>
        <div className="grid gap-3 border-t border-line p-5 pt-4 lg:grid-cols-2">
          {recommendations.map((r) => (
            <div key={r.id} className="rounded-2xl border border-line bg-surface/60 p-4">
              <Badge tone={REC_TONE[r.kind] ?? "warning"}>
                {r.kind.replaceAll("_", " ").toLowerCase()}
              </Badge>
              <p className="mt-2 font-display text-[14.5px] font-extrabold text-ink-900">
                {r.title}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-600">{r.body}</p>

              {!canPlan && r.plan && r.planStatus === "APPROVED" && (
                <div className="mt-3 rounded-xl border border-mint-200 bg-mint-500/5 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-mint-600">
                    Next-step plan · approved
                  </p>
                  {r.plan.split("\n").filter(Boolean).map((line, i) => (
                    <p key={i} className="mt-1 text-[13px] text-ink-700">
                      {line}
                    </p>
                  ))}
                </div>
              )}

              {canPlan && (
                <form
                  action={planFormAction.bind(null, r.id)}
                  className="mt-3 border-t border-line pt-3"
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-[11.5px] font-bold uppercase tracking-wider text-ink-400">
                      Next-step plan
                    </span>
                    <Badge
                      tone={
                        r.planStatus === "APPROVED"
                          ? "success"
                          : r.planStatus === "PROPOSED"
                            ? "info"
                            : "neutral"
                      }
                    >
                      {r.planStatus === "APPROVED"
                        ? "shared with student"
                        : r.planStatus === "PROPOSED"
                          ? "draft saved"
                          : "not started"}
                    </Badge>
                  </div>
                  <textarea
                    name="plan"
                    rows={5}
                    defaultValue={planDefaults.get(r.id)}
                    className={`${inputCls} font-mono text-[12.5px] leading-relaxed`}
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="submit"
                      name="intent"
                      value="save"
                      className="rounded-xl border border-line bg-card px-3 py-1.5 text-[12.5px] font-bold text-ink-600 transition hover:border-brand-300 hover:text-brand-700"
                    >
                      Save draft
                    </button>
                    <button
                      type="submit"
                      name="intent"
                      value="approve"
                      className="rounded-xl bg-mint-500 px-3 py-1.5 text-[12.5px] font-bold text-white transition hover:bg-mint-600"
                    >
                      Approve & share
                    </button>
                    {r.planStatus === "APPROVED" && (
                      <button
                        type="submit"
                        name="intent"
                        value="unshare"
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-[12.5px] font-bold text-rose-600 transition hover:bg-rose-100"
                      >
                        Stop sharing
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Progress trend" sub="All assessments & quizzes, chronological" />
          <div className="px-3 pb-5 pt-2">
            <TrendArea data={pulse.trendSeries} height={240} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Attendance" sub="All recorded days" />
          <div className="px-6 pb-6 pt-2">
            <AttendanceDonut pct={pulse.attendancePct} />
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Subject-wise performance" sub="Average across all assessments" />
          <div className="px-3 pb-5 pt-3">
            <SubjectBars data={pulse.subjects} height={240} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Strengths & focus areas" />
          <div className="space-y-4 p-5">
            <div>
              <p className="mb-2 text-[11.5px] font-bold uppercase tracking-wider text-mint-600">
                Strengths
              </p>
              {pulse.strengths.map((s) => (
                <p key={s.subject} className="text-[13.5px] font-semibold text-ink-700">
                  {s.subject} — <span className="font-extrabold">{s.avg}%</span>
                </p>
              ))}
            </div>
            <div>
              <p className="mb-2 text-[11.5px] font-bold uppercase tracking-wider text-accent-600">
                Needs focus
              </p>
              {pulse.focus.map((s) => (
                <p key={s.subject} className="text-[13.5px] font-semibold text-ink-700">
                  {s.subject} — <span className="font-extrabold">{s.avg}%</span>
                </p>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Assessment history" sub="Most recent results" />
          <div className="max-h-[380px] overflow-y-auto px-2 pb-3 pt-1">
            <table className="w-full text-left text-sm">
              <tbody>
                {assessments.map((s) => {
                  const p = (s.marks / s.assessment.maxMarks) * 100;
                  return (
                    <tr key={s.id} className="border-b border-line last:border-0">
                      <td className="px-3 py-2.5">
                        <p className="text-[13.5px] font-semibold text-ink-900">
                          {s.assessment.title}
                        </p>
                        <p className="text-[11.5px] text-ink-400">
                          {s.assessment.subject} · {fmtDate(s.assessment.date)}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="font-extrabold text-ink-900">
                          {s.marks}/{s.assessment.maxMarks}
                        </span>
                        <span
                          className={`ml-2 font-bold ${
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

        <div className="grid gap-5">
          <Card>
            <CardHeader title="Activity record" sub="Homework, assignments & projects" />
            <ul className="divide-y divide-line">
              {activities.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold text-ink-900">
                      {a.homework.title}
                    </p>
                    <p className="text-[11.5px] text-ink-400">
                      {a.homework.kind} · {a.homework.subject} · due{" "}
                      {fmtDate(a.homework.dueDate)}
                    </p>
                  </div>
                  <Badge
                    tone={
                      a.status === "SUBMITTED"
                        ? "success"
                        : a.status === "LATE"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {a.status.toLowerCase()}
                  </Badge>
                </li>
              ))}
              {!activities.length && (
                <li className="px-5 py-6 text-center text-[13px] text-ink-500">
                  No activities yet.
                </li>
              )}
            </ul>
          </Card>

          <Card>
            <CardHeader
              title="Guidance & counseling"
              sub="Notes from teachers and counselors"
              action={
                <Link href="/counseling" className="text-[13px] font-bold text-brand-600">
                  Counseling →
                </Link>
              }
            />
            <ul className="divide-y divide-line">
              {guidance.map((g) => (
                <li key={g.id} className="px-5 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="brand">{g.category}</Badge>
                    <span className="text-[11.5px] text-ink-400">
                      {g.author.name} · {fmtDate(g.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-[13.5px] font-bold text-ink-900">{g.title}</p>
                  <p className="text-[12.5px] leading-relaxed text-ink-600">{g.body}</p>
                </li>
              ))}
              {sessions.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="flex items-center gap-1.5 text-[13.5px] font-bold text-ink-900">
                      <HeartHandshake size={13} className="text-brand-600" />
                      Session · {s.counselor.name}
                    </p>
                    <p className="text-[11.5px] text-ink-400">
                      {fmtDate(s.scheduledFor)} · {s.notes}
                    </p>
                  </div>
                  <Badge tone={s.status === "COMPLETED" ? "success" : "info"}>
                    {s.status.toLowerCase()}
                  </Badge>
                </li>
              ))}
              {!guidance.length && !sessions.length && (
                <li className="px-5 py-6 text-center text-[13px] text-ink-500">
                  No guidance notes yet.
                </li>
              )}
            </ul>
          </Card>

          {canPlan && (
            <Card>
              <CardHeader
                title="Support steps"
                sub="Log what you try with this student, then record whether it helped"
                action={<Badge tone="info">{interventions.length}</Badge>}
              />
              <InterventionPanel
                studentId={student.id}
                canEdit
                items={interventions.map((i) => ({
                  id: i.id,
                  title: i.title,
                  note: i.note,
                  status: i.status,
                  outcome: i.outcome,
                  createdByName: i.createdBy.name,
                  createdAt: fmtDate(i.createdAt),
                }))}
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
