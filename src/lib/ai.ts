import { db } from "@/lib/db";
import { studentPulse } from "@/lib/insights";
import { learningGaps } from "@/lib/gaps";
import { BANK, SUBJECTS, SYLLABUS, type BankQuestion } from "@/lib/question-bank";
import { callGeminiJSON } from "@/lib/gemini";

type NewRec = {
  kind: string;
  title: string;
  body: string;
  context?: string;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function syllabusHint(subject: string, n = 2): string {
  const chapters = SYLLABUS[subject] ?? [];
  if (!chapters.length) return "";
  const pick = chapters.slice(0, n).join(", ");
  return ` Syllabus chapters to start with: ${pick}.`;
}

export async function buildRecommendations(studentId: string): Promise<NewRec[]> {
  const pulse = await studentPulse(studentId);
  if (!pulse) return [];
  const recs: NewRec[] = [];
  const weakest = pulse.subjects[pulse.subjects.length - 1];
  const strongest = pulse.subjects[0];

  if (weakest && weakest.avg < 55) {
    recs.push({
      kind: "SUBJECT_SUPPORT",
      title: `Extra practice needed in ${weakest.subject}`,
      body: `Recent average in ${weakest.subject} is ${Math.round(weakest.avg)}%.${syllabusHint(weakest.subject)}Revise these chapters for 30 minutes daily, then re-attempt a practice quiz to re-check understanding — the new result will update ${pulse.student.user.name.split(" ")[0]}'s progress analysis.`,
      context: weakest.subject,
    });
  }

  if (pulse.delta <= -8) {
    const earlier = pulse.recentAvg - pulse.delta;
    recs.push({
      kind: "DECLINE",
      title: "Performance dipped in recent assessments",
      body: `Scores fell by ${Math.round(Math.abs(pulse.delta))} points over the last few assessments compared to the earlier average of ${Math.round(earlier)}%. Review the latest test paper topic-by-topic, clear doubts with the subject teacher, and schedule a short revision test next week.`,
    });
  }

  if (pulse.attendancePct < 75) {
    recs.push({
      kind: "ATTENDANCE",
      title: "Attendance is below the required 75%",
      body: `Overall attendance is ${Math.round(pulse.attendancePct)}%${pulse.recentAbsents.length ? `, with recent absences on ${pulse.recentAbsents.map((a) => new Date(a.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })).join(", ")}` : ""}. Missing classes directly affects concept continuity. Please ensure regular attendance and inform the class teacher of planned absences.`,
    });
  }

  if (pulse.overdueHw.length >= 2) {
    recs.push({
      kind: "HOMEWORK",
      title: `${pulse.overdueHw.length} overdue activities pending`,
      body: `Pending: ${pulse.overdueHw.map((h) => `${h.homework.title} (${h.homework.subject})`).join("; ")}. Submit these first — pending work is part of the activity record teachers review.`,
    });
  }

  if (strongest && strongest.avg >= 78) {
    recs.push({
      kind: "STRENGTH",
      title: `${strongest.subject} is a clear strength`,
      body: `Consistently scoring ${Math.round(strongest.avg)}% in ${strongest.subject}. Try harder challenge questions or school-level competitions to stay engaged while others catch up.`,
      context: strongest.subject,
    });
  }

  if (weakest) {
    recs.push({
      kind: "QUIZ_SUGGESTION",
      title: `AI practice quiz ready: ${weakest.subject}`,
      body: `A personalized 5-question quiz has been prepared for ${weakest.subject} based on the class syllabus and recent performance.${syllabusHint(weakest.subject, 3)} Attempt it from the Quizzes section — the score is added straight into the progress history.`,
      context: weakest.subject,
    });
  }

  if (!recs.length) {
    recs.push({
      kind: "ON_TRACK",
      title: "On track — maintain the routine",
      body: `Performance (${Math.round(pulse.overall)}%) and attendance (${Math.round(pulse.attendancePct)}%) are both healthy. Continue the weekly study plan and attempt the next practice quiz when ready.`,
    });
  }

  const picked = recs.slice(0, 6);
  return enrichRecBodies(studentId, pulse, picked);
}

async function enrichRecBodies(
  studentId: string,
  pulse: NonNullable<Awaited<ReturnType<typeof studentPulse>>>,
  recs: NewRec[]
): Promise<NewRec[]> {
  if (!recs.length) return recs;
  const gaps = await learningGaps(studentId);

  const data = {
    firstName: pulse.student.user.name.split(" ")[0],
    overallPercent: Math.round(pulse.overall),
    attendancePercent: Math.round(pulse.attendancePct),
    subjects: pulse.subjects.map((s) => ({
      subject: s.subject,
      average: Math.round(s.avg),
      trend: Math.round(s.trend),
    })),
    weakChapters: gaps.weak
      .slice(0, 3)
      .map((g) => `${g.subject}: ${g.chapter} (${Math.round(g.pct)}%)`),
    overdueHomework: pulse.overdueHw.map(
      (h) => `${h.homework.title} (${h.homework.subject})`
    ),
    recentAbsences: pulse.recentAbsents.length,
  };

  const system =
    "You write recommendation bodies shown to a school student and their teacher on Vidyora. " +
    "For EACH detected recommendation, write a grounded, specific, encouraging 45-75 word paragraph: what the data shows, why it matters, and exactly what to do next. " +
    "Warm coaching tone — never label the child as weak or failing. English only. No lists, no headers, no markdown.";

  const prompt = `Student data (JSON): ${JSON.stringify(data)}

Detected recommendations — keep EXACTLY this order and refer to each one's topic:
${JSON.stringify(
  recs.map((r, i) => ({ i, kind: r.kind, title: r.title, context: r.context ?? null }))
)}

Return ONLY: {"bodies":["..."]} with exactly ${recs.length} strings.`;

  const bodies = await callGeminiJSON<string[]>(
    {
      prompt,
      system,
      json: true,
      temperature: 0.6,
      maxTokens: 900,
      timeoutMs: 5000,
      retries: 0,
      cacheKey: `recbodies:${studentId}:${recs.map((r) => r.kind).join(",")}`,
      cacheTtlMs: 4 * 3600_000,
    },
    (v) => {
      const b = (v as { bodies?: unknown })?.bodies;
      if (!Array.isArray(b) || b.length !== recs.length) return null;
      const out = b.map((x) =>
        typeof x === "string" ? x.replace(/\s+/g, " ").trim().slice(0, 540) : ""
      );
      return out.every(Boolean) ? out : null;
    }
  );

  if (!bodies) return recs;
  return recs.map((r, i) => ({ ...r, body: bodies[i] }));
}

export async function ensureRecommendations(studentId: string, force = false) {
  const existing = await db.recommendation.findMany({
    where: { studentId },
    orderBy: { updatedAt: "desc" },
  });
  const fresh =
    existing.length > 0 &&
    Date.now() - existing[0].updatedAt.getTime() < 48 * 3600 * 1000;
  if (fresh && !force) return existing;

  const carriedPlans = new Map<
    string,
    { plan: string; planStatus: string }
  >();
  for (const r of existing) {
    if (r.plan && r.planStatus !== "NONE" && !carriedPlans.has(r.kind)) {
      carriedPlans.set(r.kind, { plan: r.plan, planStatus: r.planStatus });
    }
  }

  if (existing.length) await db.recommendation.deleteMany({ where: { studentId } });
  const recs = await buildRecommendations(studentId);
  if (recs.length) {
    await db.recommendation.createMany({
      data: recs.map((r) => {
        const carry = carriedPlans.get(r.kind);
        return {
          ...r,
          studentId,
          plan: carry?.plan ?? null,
          planStatus: carry?.planStatus ?? "NONE",
        };
      }),
    });
  }
  return db.recommendation.findMany({
    where: { studentId },
    orderBy: { updatedAt: "desc" },
  });
}

export function pickQuizQuestions(subject: string, chapter?: string | null) {
  const pool = BANK[subject] ?? [];
  if (pool.length < 5) throw new Error(`Not enough questions in the bank for ${subject}.`);
  const preferred = chapter ? pool.filter((q) => q.chapter === chapter) : [];
  const others = pool.filter((q) => q.chapter !== chapter);
  const ordered = [...shuffle(preferred), ...shuffle(others)];
  return ordered.slice(0, 5);
}

function clean(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function validateAiQuiz(
  v: unknown,
  subject: string,
  chapter: string | null
): BankQuestion[] | null {
  const rows = (v as { questions?: unknown })?.questions;
  if (!Array.isArray(rows)) return null;
  const out: BankQuestion[] = [];
  for (const raw of rows.slice(0, 7)) {
    const r = raw as { q?: unknown; options?: unknown; answer?: unknown; chapter?: unknown };
    const q = clean(r.q, 240);
    const options = Array.isArray(r.options)
      ? r.options.map((o) => clean(o, 130))
      : [];
    const answer = r.answer;
    if (!q || options.length !== 4 || options.some((o) => !o)) continue;
    if (new Set(options.map((o) => o.toLowerCase())).size !== 4) continue;
    if (typeof answer !== "number" || !Number.isInteger(answer) || answer < 0 || answer > 3)
      continue;
    const ch = clean(r.chapter, 60) || chapter || "General";
    out.push({ chapter: ch, q, options, answer });
    if (out.length === 5) break;
  }
  return out.length === 5 ? out : null;
}

export async function aiQuizQuestions(
  subject: string,
  chapter: string | null,
  classLabel: string | null,
  hints: string[] = []
): Promise<BankQuestion[] | null> {
  if (!(SUBJECTS as readonly string[]).includes(subject)) return null;
  const chapters = SYLLABUS[subject] ?? [];

  const system =
    "You are an assessment writer for Indian CBSE-style schools (classes 6-9). " +
    "Write accurate, unambiguous multiple-choice questions a school teacher would approve. " +
    "Reply with ONLY a JSON object, no markdown.";

  const prompt = [
    `Class: ${classLabel || "Class 6-9"}. Subject: ${subject}.`,
    chapter
      ? `Target chapter/topic: "${chapter}". Every question must be about it.`
      : `Cover these syllabus chapters across the 5 questions: ${chapters.join(", ")}.`,
    hints.length
      ? `The student recently missed questions on: ${hints.join(" | ")}. Include 1-2 questions probing exactly those skills.`
      : "",
    "Level: moderate mix (3 straightforward, 2 slightly tricky). All in English"
      .concat(subject === "Hindi" ? " EXCEPT the questions themselves, which must be in Hindi." : "."),
    "4 distinct options each (no 'All of these'), exactly one correct.",
    'Return: {"questions":[{"chapter":"...","q":"...","options":["...","...","...","..."],"answer":0}]} with EXACTLY 5 questions; answer is the 0-based index of the correct option.',
  ]
    .filter(Boolean)
    .join("\n");

  return callGeminiJSON(
    {
      prompt,
      system,
      json: true,
      temperature: 0.7,
      maxTokens: 1200,
      timeoutMs: 5000,
      retries: 0,
    },
    (v) => validateAiQuiz(v, subject, chapter)
  );
}

export async function createClassQuiz(input: {
  classId: string;
  subject: string;
  chapter?: string | null;
  createdById?: string;
  hints?: string[];
}) {
  const chapter = input.chapter ?? null;
  const cls = await db.schoolClass.findUnique({
    where: { id: input.classId },
    select: { name: true },
  });
  const aiQs = await aiQuizQuestions(
    input.subject,
    chapter,
    cls?.name ?? null,
    input.hints ?? []
  );
  const questions: BankQuestion[] = aiQs ?? pickQuizQuestions(input.subject, chapter);
  const title = chapter
    ? `${input.subject} – ${chapter} (Practice Quiz)`
    : `${input.subject} – AI Practice Quiz`;
  return db.quiz.create({
    data: {
      title,
      classId: input.classId,
      subject: input.subject,
      chapter: chapter,
      questions: JSON.stringify(questions),
      createdById: input.createdById ?? null,
    },
  });
}

export async function createPracticeQuizForStudent(studentId: string) {
  const pulse = await studentPulse(studentId);
  if (!pulse) throw new Error("Student not found.");
  const weakest =
    pulse.subjects[pulse.subjects.length - 1]?.subject ?? pulse.subjects[0]?.subject;
  if (!weakest) throw new Error("No subject data available yet.");

  const { learningGaps } = await import("@/lib/gaps");
  const gaps = await learningGaps(studentId);
  const weakChapter =
    gaps.weak.find((c) => c.subject === weakest)?.chapter ??
    gaps.weakest?.chapter ??
    null;

  const hints = gaps.chapters
    .filter((c) => c.subject === weakest && (!weakChapter || c.chapter === weakChapter))
    .flatMap((c) => c.wrong.map((w) => w.q))
    .slice(0, 3);

  return createClassQuiz({
    classId: pulse.student.classId,
    subject: weakest,
    chapter: weakChapter,
    hints,
  });
}

function draftPlanLocal(rec: {
  kind: string;
  title: string;
  body: string;
  context?: string | null;
}): string {
  const focus = rec.context
    ? `Focus topic: ${rec.context}.`
    : "Focus on the areas mentioned below.";
  switch (rec.kind) {
    case "SUBJECT_SUPPORT":
      return [
        `1. Revise ${rec.context ?? "the weakest subject"} basics for 20 minutes daily this week.`,
        "2. Solve 10 textbook questions from the flagged chapter and mark doubts.",
        "3. Attempt the AI practice quiz for this chapter and score above 70%.",
        "4. Ask one doubt in class or from the teacher before Friday.",
        focus,
      ].join("\n");
    case "DECLINE":
      return [
        "1. Compare the last two test papers — list the 3 questions marks were lost on.",
        "2. Redo those questions without looking at solutions.",
        "3. Take one AI practice quiz every alternate day on the declining subject.",
        "4. Review progress with teacher in the next parent-teacher meeting.",
        focus,
      ].join("\n");
    case "ATTENDANCE":
      return [
        "1. Maintain a daily sleep and study timetable — target 8 hours of sleep.",
        "2. Keep all pending work cleared the same day as absence.",
        "3. Aim for full attendance for the next 2 weeks and track it here.",
        focus,
      ].join("\n");
    case "HOMEWORK":
      return [
        "1. Clear all pending homework within the next 3 days.",
        "2. Set a daily 4:00–5:00 PM homework slot at home.",
        "3. Get submissions checked by the teacher the same day.",
        focus,
      ].join("\n");
    case "QUIZ_SUGGESTION":
      return [
        "1. Attempt the recommended AI practice quiz this week.",
        "2. Revise every question answered incorrectly.",
        "3. Re-attempt after 3 days — target 80% or better.",
        focus,
      ].join("\n");
    default:
      return [
        "1. Continue the current revision routine across all subjects.",
        "2. Attempt one AI practice quiz every week to stay sharp.",
        "3. Keep homework and attendance consistent.",
        focus,
      ].join("\n");
  }
}

export async function draftPlan(rec: {
  kind: string;
  title: string;
  body: string;
  context?: string | null;
}): Promise<string> {
  const fallback = draftPlanLocal(rec);

  const system =
    "You draft a short next-step study plan that a teacher will review and approve on Vidyora. " +
    "Write 4-5 concrete steps a student can complete within one week, specific to this recommendation and the given data. " +
    "Warm, encouraging, plain English. No markdown, no headers.";

  const prompt = `Recommendation (JSON): ${JSON.stringify({
    kind: rec.kind,
    title: rec.title,
    context: rec.context ?? null,
    summary: rec.body.slice(0, 400),
  })}

Return ONLY: {"steps":["..."]} with 4-5 short action strings (each under 160 chars).`;

  const steps = await callGeminiJSON<string[]>(
    {
      prompt,
      system,
      json: true,
      temperature: 0.5,
      maxTokens: 700,
      timeoutMs: 5000,
      retries: 0,
      cacheKey: `plan:${rec.kind}:${rec.title.slice(0, 48)}`,
      cacheTtlMs: 4 * 3600_000,
    },
    (v) => {
      const s = (v as { steps?: unknown })?.steps;
      if (!Array.isArray(s)) return null;
      const out = s
        .map((x) =>
          typeof x === "string" ? x.replace(/\s+/g, " ").trim().slice(0, 240) : ""
        )
        .filter(Boolean)
        .slice(0, 6);
      return out.length >= 3 ? out : null;
    }
  );

  if (!steps) return fallback;
  const numbered = steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
  return rec.context ? `${numbered}\nFocus topic: ${rec.context}.` : numbered;
}
