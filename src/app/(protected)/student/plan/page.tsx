import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpenCheck,
  CheckCircle2,
  Flag,
  Plus,
  Sparkles,
} from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { learningGaps } from "@/lib/gaps";
import { improveFor } from "@/lib/improve";
import { progressTimeline, studentPulse } from "@/lib/insights";
import { SUBJECTS, SYLLABUS } from "@/lib/question-bank";
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
import { ImprovePicker, type ImproveSubject } from "@/components/improve-picker";
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

export default async function StudentPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ gsubj?: string }>;
}) {
  const session = await requireSession(["STUDENT"]);
  const student = await db.student.findUnique({
    where: { userId: session.sub },
    include: { schoolClass: true },
  });
  if (!student) notFound();

  const { gsubj } = await searchParams;

  const [gaps, recs, goals, timeline, pulse, scores] = await Promise.all([
    learningGaps(student.id),
    ensureRecommendations(student.id),
    db.studentGoal.findMany({
      where: { studentId: student.id },
      orderBy: { updatedAt: "desc" },
    }),
    progressTimeline(student.id, 14),
    studentPulse(student.id),
    db.score.findMany({
      where: { studentId: student.id },
      include: {
        assessment: { select: { title: true, subject: true, date: true, maxMarks: true } },
      },
      orderBy: { assessment: { date: "desc" } },
      take: 300,
    }),
  ]);

  type RecentTest = {
    title: string;
    date: Date;
    marks: number;
    max: number;
    pct: number;
  };
  const testsBySubject = new Map<string, RecentTest[]>();
  for (const s of scores) {
    const list = testsBySubject.get(s.assessment.subject) ?? [];
    if (list.length < 5) {
      list.push({
        title: s.assessment.title,
        date: s.assessment.date,
        marks: s.marks,
        max: s.assessment.maxMarks,
        pct:
          s.assessment.maxMarks > 0
            ? (s.marks / s.assessment.maxMarks) * 100
            : 0,
      });
    }
    testsBySubject.set(s.assessment.subject, list);
  }
  const recentPct = (tests: RecentTest[]) => {
    const m = tests.reduce((a, t) => a + t.marks, 0);
    const mx = tests.reduce((a, t) => a + t.max, 0);
    return mx > 0 ? (m / mx) * 100 : null;
  };

  const hasData = (name: string) =>
    (testsBySubject.get(name)?.length ?? 0) > 0 ||
    gaps.chapters.some((c) => c.subject === name);
  const selected =
    gsubj && (SUBJECTS as readonly string[]).includes(gsubj) && hasData(gsubj)
      ? gsubj
      : SUBJECTS.find(hasData) ?? SUBJECTS[0];
  const recentTests = testsBySubject.get(selected) ?? [];
  const recentAvg = recentPct(recentTests);
  const selectedChapters = gaps.chapters.filter((c) => c.subject === selected);
  const subjectRecs = recs.filter((r) => r.context === selected);

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

  const SEVERITY_RANK = { weak: 0, review: 1, new: 2, strong: 3 } as const;
  const improveData: ImproveSubject[] = SUBJECTS.map((subject) => {
    const gapChs = gaps.chapters.filter((c) => c.subject === subject);
    const chapters = [
      ...new Set([...gapChs.map((c) => c.chapter), ...(SYLLABUS[subject] ?? [])]),
    ];
    const topics = chapters
      .map((chapter) => {
        const gap = gapChs.find((c) => c.chapter === chapter);
        const severity = gap ? gap.severity : ("new" as const);
        const pct = gap?.pct ?? null;
        const rec =
          severity === "new"
            ? `New for you — start with the video below, then try your first ${subject} quiz on ${chapter}.`
            : severity === "weak"
              ? `Focus chapter at ${Math.round(pct ?? 0)}% — a few short daily sessions on ${chapter} will lift your ${subject} score fastest.`
              : severity === "review"
                ? `Almost there at ${Math.round(pct ?? 0)}% — one careful revision round of ${chapter} should push it up.`
                : `Solid at ${Math.round(pct ?? 0)}% — keep it fresh with a quick revision quiz.`;
        return {
          chapter,
          severity,
          pct,
          correct: gap?.correct ?? 0,
          total: gap?.total ?? 0,
          wrong: gap?.wrong ?? [],
          rec,
          plan: improveFor(subject, chapter),
        };
      })
      .sort(
        (a, b) =>
          SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
          (a.pct ?? 999) - (b.pct ?? 999)
      );
    return { subject, topics };
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
              sub="Pick a subject — recent-test accuracy, chapter gaps and your AI focus note"
              action={
                recentAvg !== null ? (
                  <Badge tone="brand">
                    {selected} · {Math.round(recentAvg)}% recent
                  </Badge>
                ) : (
                  <Badge tone="neutral">{selected} · no tests yet</Badge>
                )
              }
            />
            <div className="flex flex-wrap gap-1.5 px-5 pt-1">
              {SUBJECTS.map((name) => {
                const active = name === selected;
                const tests = testsBySubject.get(name);
                const p = tests?.length ? recentPct(tests) : null;
                return (
                  <Link
                    key={name}
                    href={`/student/plan?gsubj=${encodeURIComponent(name)}`}
                    aria-current={active ? "true" : undefined}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12.5px] font-bold transition ${
                      active
                        ? "border-brand-600 bg-brand-600 text-white"
                        : "border-line bg-card text-ink-600 hover:border-brand-300 hover:text-brand-700"
                    }`}
                  >
                    {name}
                    {p !== null && (
                      <span
                        className={`text-[11px] font-extrabold ${
                          active ? "text-white/80" : "text-ink-400"
                        }`}
                      >
                        {Math.round(p)}%
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="space-y-4 p-5 pt-3">
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface/60 px-4 py-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
                    Last {recentTests.length || "no"} test
                    {recentTests.length === 1 ? "" : "s"}
                  </p>
                  <p className="font-display text-xl font-extrabold text-ink-900">
                    {recentAvg !== null ? `${Math.round(recentAvg)}%` : "—"}
                  </p>
                </div>
                <div className="h-9 w-px bg-line" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
                    Chapters to revisit
                  </p>
                  <p className="font-display text-xl font-extrabold text-ink-900">
                    {selectedChapters.filter((c) => c.severity !== "strong").length}
                  </p>
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <p className="text-[12px] leading-relaxed text-ink-500">
                    {recentTests[0]
                      ? `Latest: ${recentTests[0].title} · ${Math.round(recentTests[0].pct)}%`
                      : `Attempt your first ${selected} quiz — its result will show up here.`}
                  </p>
                </div>
              </div>

              {subjectRecs.length > 0 && (
                <div className="space-y-2">
                  {subjectRecs.slice(0, 2).map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl border border-brand-200 bg-brand-50/50 px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Sparkles size={13} className="text-brand-600" />
                        <p className="font-display text-[13.5px] font-extrabold text-ink-900">
                          {r.title}
                        </p>
                        {r.planStatus === "APPROVED" && r.plan && (
                          <Badge tone="success">Teacher approved</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-[13px] leading-relaxed text-ink-600">
                        {r.body}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {recentTests.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[460px] text-left text-sm">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-ink-400">
                        <th className="px-4 py-2 font-bold">Recent test</th>
                        <th className="px-4 py-2 font-bold">Date</th>
                        <th className="px-4 py-2 font-bold text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTests.map((t, i) => (
                        <tr key={i} className="border-t border-line">
                          <td className="px-4 py-2.5 font-semibold text-ink-900">
                            {t.title}
                          </td>
                          <td className="px-4 py-2.5 text-ink-500">
                            {fmtDate(t.date)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-extrabold text-ink-900">
                            {t.marks}/{t.max} ·{" "}
                            <span
                              className={
                                t.pct >= 75
                                  ? "text-mint-600"
                                  : t.pct >= 50
                                    ? "text-accent-600"
                                    : "text-rose-600"
                              }
                            >
                              {Math.round(t.pct)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedChapters.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-ink-400">
                        <th className="px-4 py-2 font-bold">Chapter / topic</th>
                        <th className="px-4 py-2 font-bold">Accuracy</th>
                        <th className="px-4 py-2 font-bold">Level</th>
                        <th className="px-4 py-2 font-bold"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedChapters.slice(0, 10).map((c, i) => (
                        <tr key={i} className="border-t border-line">
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
                  title={`No quiz data for ${selected} yet`}
                  hint="Attempt a few AI quizzes — your chapter-wise gaps will appear here automatically."
                  icon={<BookOpenCheck size={20} />}
                />
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Improve any topic"
              sub="Pick a subject and topic — tricks, question types to practise and an explanation video"
              action={<Badge tone="warning">Self-paced</Badge>}
            />
            <div className="p-5 pt-4">
              <ImprovePicker subjects={improveData} defaultSubject={selected} />
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
