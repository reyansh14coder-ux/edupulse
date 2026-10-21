import { notFound } from "next/navigation";
import {
  BookOpenCheck,
  CheckCircle2,
  Flag,
  Lightbulb,
  Play,
  Plus,
  Sparkles,
  Target,
  XCircle,
} from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { learningGaps } from "@/lib/gaps";
import { improveFor } from "@/lib/improve";
import { progressTimeline, studentPulse } from "@/lib/insights";
import { SUBJECTS } from "@/lib/question-bank";
import { ensureRecommendations } from "@/lib/ai";
import { fmtDate } from "@/lib/utils";
import { SubjectDive } from "@/components/dive-deeper";
import {
  addGoalAction,
  reflectAction,
  reopenGoalAction,
  toggleGoalAction,
} from "@/app/actions/goals";
import { practiceForChapterAction } from "@/app/actions/quiz";
import { PracticeQuizButton } from "@/components/teacher-forms";
import {
  Badge,
  btnOutline,
  btnPrimary,
  Card,
  CardHeader,
  EmptyState,
  inputCls,
  PageHeader,
} from "@/components/ui";

export const metadata = { title: "My learning plan" };

const SEVERITY_TONE = {
  weak: "danger",
  review: "warning",
  strong: "success",
} as const;

export default async function StudentPlanPage() {
  const session = await requireSession(["STUDENT"]);
  const student = await db.student.findUnique({
    where: { userId: session.sub },
    include: { schoolClass: true },
  });
  if (!student) notFound();

  const [gaps, recs, goals, timeline, pulse] = await Promise.all([
    learningGaps(student.id),
    ensureRecommendations(student.id),
    db.studentGoal.findMany({
      where: { studentId: student.id },
      orderBy: { updatedAt: "desc" },
    }),
    progressTimeline(student.id, 14),
    studentPulse(student.id),
  ]);

  const subjectRows = SUBJECTS.map((name) => {
    const stat = pulse?.subjects.find((s) => s.subject === name) ?? null;
    const chs = gaps.chapters.filter((c) => c.subject === name);
    const weak = chs.filter((c) => c.severity !== "strong");
    const summary = !stat
      ? `No ${name} scores yet — attempt your first ${name} quiz and your analysis will appear here.`
      : stat.avg >= 75
        ? `Going well at ${Math.round(stat.avg)}% — maintain your routine and aim for mastery.`
        : `At ${Math.round(stat.avg)}% across ${stat.count} assessment${stat.count > 1 ? "s" : ""} — focused work on ${weak[0]?.chapter ?? "one chapter"} will move you to the next level.`;
    return {
      name,
      avg: stat ? Math.round(stat.avg) : null,
      count: stat?.count ?? 0,
      trend: stat?.trend ?? 0,
      weak: weak.slice(0, 3).map((w) => ({ chapter: w.chapter, pct: w.pct })),
      summary,
    };
  });

  const approved = recs.filter((r) => r.planStatus === "APPROVED" && r.plan);
  const activeGoals = goals.filter((g) => g.kind === "GOAL" && g.status === "ACTIVE");
  const pastGoals = goals.filter((g) => g.kind === "GOAL" && g.status !== "ACTIVE");
  const reflections = goals.filter((g) => g.kind === "REFLECTION");

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My learning plan"
        sub="Learning gaps, teacher-approved next-step plans, goals and your progress timeline — the improve loop in one place."
        action={
          <div className="flex gap-2">
            <PracticeQuizButton />
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader
              title="Subject-wise AI recommendations"
              sub="Where you stand in every subject, what to focus next, and a deeper AI analysis on demand"
              action={
                <Badge tone="brand">
                  <Sparkles size={11} /> {subjectRows.filter((r) => r.avg !== null).length}/
                  {SUBJECTS.length} active
                </Badge>
              }
            />
            <div className="space-y-3 p-5 pt-4">
              {subjectRows.map((r) => (
                <SubjectDive
                  key={r.name}
                  subject={r.name}
                  summary={r.summary}
                  avg={r.avg}
                  count={r.count}
                  trend={r.trend}
                  weak={r.weak}
                />
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Learning gap detector"
              sub="Chapter-wise accuracy from your quiz attempts — focus chapters first"
              action={
                <Badge tone={gaps.weak.length ? "danger" : "success"}>
                  {gaps.weak.length} chapter{gaps.weak.length === 1 ? "" : "s"} to revisit
                </Badge>
              }
            />
            {gaps.chapters.length ? (
              <div className="overflow-x-auto px-2 pb-4 pt-2">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-ink-400">
                      <th className="px-4 py-2 font-bold">Subject</th>
                      <th className="px-4 py-2 font-bold">Chapter / topic</th>
                      <th className="px-4 py-2 font-bold">Accuracy</th>
                      <th className="px-4 py-2 font-bold">Level</th>
                      <th className="px-4 py-2 font-bold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {gaps.chapters.slice(0, 8).map((c, i) => (
                      <tr key={i} className="border-t border-line">
                        <td className="px-4 py-2.5 font-semibold text-ink-900">
                          {c.subject}
                        </td>
                        <td className="px-4 py-2.5 text-ink-700">{c.chapter}</td>
                        <td className="px-4 py-2.5 font-extrabold text-ink-900">
                          {c.correct}/{c.total} · {Math.round(c.pct)}%
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge tone={SEVERITY_TONE[c.severity]}>
                            {c.severity === "weak"
                              ? "Focus"
                              : c.severity === "review"
                                ? "Review"
                                : "Strong"}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {c.severity !== "strong" && (
                            <form action={practiceForChapterAction}>
                              <input type="hidden" name="subject" value={c.subject} />
                              <input type="hidden" name="chapter" value={c.chapter} />
                              <button
                                type="submit"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 py-1.5 text-[12px] font-bold text-brand-600 transition hover:border-brand-300 hover:bg-brand-50"
                              >
                                <Sparkles size={12} /> Practice
                              </button>
                            </form>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No quiz data yet"
                hint="Attempt a few AI quizzes — your chapter-wise gaps will appear here automatically."
                icon={<BookOpenCheck size={20} />}
              />
            )}
          </Card>

          <Card>
            <CardHeader
              title="How to improve your gaps"
              sub="Tricks, question types to practise and an explanation video for each focus chapter"
              action={
                <Badge tone="warning">
                  {gaps.weak.length
                    ? `${Math.min(gaps.weak.length, 3)} chapters covered`
                    : "No gaps"}
                </Badge>
              }
            />
            <div className="space-y-4 p-5 pt-4">
              {gaps.weak.slice(0, 3).map((g, i) => {
                const plan = improveFor(g.subject, g.chapter);
                return (
                  <div
                    key={`${g.subject}-${g.chapter}-${i}`}
                    className="rounded-2xl border border-line bg-surface/60 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={SEVERITY_TONE[g.severity]}>
                        {g.severity === "weak" ? "Focus" : "Review"}
                      </Badge>
                      <p className="font-display text-[14.5px] font-extrabold text-ink-900">
                        {g.subject} — {g.chapter}
                      </p>
                      <span className="text-[12px] font-bold text-ink-500">
                        {Math.round(g.pct)}% accuracy ({g.correct}/{g.total})
                      </span>
                    </div>

                    {g.wrong.length > 0 && (
                      <div className="mt-3">
                        <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wider text-rose-500">
                          <XCircle size={12} /> Questions you got wrong
                        </p>
                        <ul className="mt-1.5 space-y-2">
                          {g.wrong.map((w, j) => (
                            <li
                              key={j}
                              className="rounded-xl border border-rose-100 bg-rose-50/50 px-3.5 py-2.5"
                            >
                              <p className="text-[13px] font-semibold text-ink-800">
                                {j + 1}. {w.q}
                              </p>
                              <p className="mt-1 flex flex-wrap gap-x-4 text-[12.5px] text-ink-600">
                                <span className="text-rose-600">
                                  Your answer: {w.yourAnswer}
                                </span>
                                <span className="font-semibold text-mint-600">
                                  Correct: {w.correctAnswer}
                                </span>
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-3.5">
                        <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wider text-violet-600">
                          <Lightbulb size={12} /> Tricks to solve
                        </p>
                        <ul className="mt-1.5 space-y-1.5">
                          {plan.tricks.map((t, j) => (
                            <li
                              key={j}
                              className="flex gap-2 text-[13px] leading-relaxed text-ink-700"
                            >
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-3.5">
                        <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wider text-brand-600">
                          <Target size={12} /> Practice these question types
                        </p>
                        <ul className="mt-1.5 space-y-1.5">
                          {plan.practice.map((t, j) => (
                            <li
                              key={j}
                              className="flex gap-2 text-[13px] leading-relaxed text-ink-700"
                            >
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <a
                        href={plan.video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-2 text-[12.5px] font-bold text-brand-600 transition hover:border-brand-300 hover:bg-brand-50"
                      >
                        <Play size={13} /> Watch explanation video
                      </a>
                      <span className="text-[12px] text-ink-400">
                        {plan.video.title}
                      </span>
                    </div>
                  </div>
                );
              })}
              {!gaps.weak.length && (
                <EmptyState
                  title="Every chapter is on track — great work!"
                  hint="Once you attempt chapter-wise quizzes, personalised improvement plans with tricks, practice sets and videos will appear here."
                  icon={<CheckCircle2 size={20} />}
                />
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Next-step learning plan"
              sub="Drafted from AI recommendations, edited and approved by your teacher"
              action={
                <Badge tone="brand">
                  {approved.length} shared by teacher
                </Badge>
              }
            />
            <div className="space-y-3 p-5 pt-4">
              {approved.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border border-mint-200 bg-mint-500/5 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="success">
                      <CheckCircle2 size={11} /> Approved
                    </Badge>
                    <p className="font-display text-[14.5px] font-extrabold text-ink-900">
                      {r.title}
                    </p>
                  </div>
                  <ol className="mt-2.5 space-y-1.5">
                    {(r.plan ?? "").split("\n").filter(Boolean).map((line, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-[13.5px] leading-relaxed text-ink-700"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mint-500" />
                        {line.replace(/^\d+\.\s*/, "")}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
              {!approved.length && (
                <p className="text-[13px] text-ink-500">
                  No plan approved yet — your teacher is reviewing the recommendations.
                  Meanwhile, use the gap detector above to practise.
                </p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="My goals & self-reflection"
              sub="Set your own targets, reflect every week — teachers can see your goals too"
            />
            <div className="space-y-4 p-5 pt-4">
              <form action={addGoalAction} className="flex flex-col gap-2.5 sm:flex-row">
                <input
                  name="title"
                  required
                  maxLength={90}
                  placeholder="e.g. Score 75%+ in Maths this month"
                  className={inputCls}
                />
                <input
                  name="note"
                  maxLength={140}
                  placeholder="Why this goal matters (optional)"
                  className={inputCls}
                />
                <button type="submit" className={`${btnPrimary} shrink-0`}>
                  <Plus size={15} /> Add goal
                </button>
              </form>

              <ul className="space-y-2">
                {activeGoals.map((g) => (
                  <li
                    key={g.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-line bg-surface/60 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-ink-900">{g.title}</p>
                      {g.note && (
                        <p className="mt-0.5 text-[12.5px] text-ink-500">{g.note}</p>
                      )}
                      <p className="mt-0.5 text-[11.5px] text-ink-400">
                        Set {fmtDate(g.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <form action={toggleGoalAction.bind(null, g.id, "done")}>
                        <button
                          type="submit"
                          className="rounded-lg border border-mint-200 bg-mint-500/10 px-2.5 py-1.5 text-[12px] font-bold text-mint-600 transition hover:bg-mint-500/20"
                        >
                          <CheckCircle2 size={13} />
                        </button>
                      </form>
                      <form action={toggleGoalAction.bind(null, g.id, "drop")}>
                        <button
                          type="submit"
                          className="rounded-lg border border-line bg-card px-2.5 py-1.5 text-[12px] font-bold text-ink-400 transition hover:text-rose-600"
                        >
                          <Flag size={13} />
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
                {!activeGoals.length && (
                  <li className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-[13px] text-ink-500">
                    No active goals — add your first one above.
                  </li>
                )}
              </ul>

              {pastGoals.length > 0 && (
                <div>
                  <p className="mb-2 text-[11.5px] font-bold uppercase tracking-wider text-ink-400">
                    Earlier goals
                  </p>
                  <ul className="space-y-1.5">
                    {pastGoals.slice(0, 5).map((g) => (
                      <li
                        key={g.id}
                        className="flex items-center justify-between gap-2 text-[13px]"
                      >
                        <span
                          className={
                            g.status === "DONE"
                              ? "text-ink-500 line-through"
                              : "text-ink-400"
                          }
                        >
                          {g.title}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge tone={g.status === "DONE" ? "success" : "neutral"}>
                            {g.status.toLowerCase()}
                          </Badge>
                          <form action={reopenGoalAction.bind(null, g.id)}>
                            <button
                              type="submit"
                              className="text-[11.5px] font-bold text-brand-600 hover:underline"
                            >
                              reopen
                            </button>
                          </form>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-t border-line pt-4">
                <p className="mb-2 flex items-center gap-1.5 text-[12.5px] font-bold text-ink-700">
                  <Sparkles size={13} className="text-violet-500" /> Weekly
                  self-reflection
                </p>
                <form action={reflectAction} className="space-y-2.5">
                  <textarea
                    name="note"
                    required
                    rows={3}
                    maxLength={600}
                    placeholder="What went well this week? What will you do differently next week?"
                    className={inputCls}
                  />
                  <button type="submit" className={btnOutline}>
                    Save reflection
                  </button>
                </form>
                {reflections.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {reflections.slice(0, 3).map((r) => (
                      <li
                        key={r.id}
                        className="rounded-xl border border-violet-200 bg-violet-50/50 px-4 py-3"
                      >
                        <p className="text-[11.5px] font-bold uppercase tracking-wider text-violet-500">
                          {fmtDate(r.createdAt)}
                        </p>
                        <p className="mt-1 text-[13.5px] leading-relaxed text-ink-700">
                          {r.note}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Practice smarter"
               sub="AI quiz for your focus chapter"
            />
            <div className="p-5 pt-3">
              <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 p-4 text-white">
                <p className="font-display text-[14.5px] font-extrabold">
                  {gaps.weakest
                    ? `Focus: ${gaps.weakest.subject} — ${gaps.weakest.chapter}`
                    : "Get your personalised practice quiz"}
                </p>
                <p className="mt-1 text-[12.5px] text-white/75">
                  {gaps.weakest
                    ? `Accuracy ${Math.round(gaps.weakest.pct)}% here — practising this first moves you up fastest.`
                    : "Generated from your marks and gaps, adds to progress history."}
                </p>
                <div className="mt-3">
                  <PracticeQuizButton />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Progress timeline"
              sub="Tests, quizzes, activities, goals — newest first"
            />
            <ul className="space-y-0 p-5 pt-3">
              {timeline.map((e) => (
                <li key={e.id} className="relative flex gap-3 pb-4 last:pb-0">
                  <span
                    className={`absolute left-[6px] top-6 h-full w-px ${
                      e.tone === "success"
                        ? "bg-mint-200"
                        : e.tone === "danger"
                          ? "bg-rose-200"
                          : e.tone === "warning"
                            ? "bg-accent-200"
                            : e.tone === "brand"
                              ? "bg-brand-200"
                              : "bg-line"
                    }`}
                    aria-hidden
                  />
                  <span
                    className={`relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ring-card ${
                      e.tone === "success"
                        ? "bg-mint-500"
                        : e.tone === "danger"
                          ? "bg-rose-500"
                          : e.tone === "warning"
                            ? "bg-accent-500"
                            : e.tone === "brand"
                              ? "bg-brand-500"
                              : "bg-ink-300"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-bold text-ink-900">
                      {e.title}
                    </p>
                    <p className="text-[11.5px] text-ink-500">
                      {fmtDate(e.date)} · {e.meta}
                    </p>
                  </div>
                </li>
              ))}
              {!timeline.length && (
                <li className="py-6 text-center text-[13px] text-ink-500">
                  Events will appear as you study.
                </li>
              )}
            </ul>
          </Card>

          <Card>
            <CardHeader title="The improve loop" />
            <ol className="space-y-2.5 p-5 pt-3 text-[13px] text-ink-600">
              {[
                "Collect — attendance, marks, activities",
                "Track — dashboard & timeline",
                "Analyze — AI recommendations & gap detector",
                "Recommend — next-step plan (teacher approved)",
                "Assess — quizzes feed back into the loop",
                "Re-analyze & improve",
              ].map((s, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-extrabold text-brand-600">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
