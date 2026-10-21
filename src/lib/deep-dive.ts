import { db } from "@/lib/db";
import { learningGaps, type ChapterGap } from "@/lib/gaps";
import { studentPulse } from "@/lib/insights";
import { improveFor } from "@/lib/improve";
import { callGeminiJSON } from "@/lib/gemini";
import { SUBJECTS, SYLLABUS } from "@/lib/question-bank";

export type DiveVideo = { title: string; url: string };

export type DeepDive = {
  summary: string;
  reasons: string[];
  practice: string[];
  steps: string[];
  videos: DiveVideo[];
  source: "ai" | "local";
};

const YT_OK = (u: string) =>
  /^https:\/\/(www\.|m\.)?youtube\.com\/watch\?v=[A-Za-z0-9_-]{6,}$/.test(u) ||
  /^https:\/\/youtu\.be\/[A-Za-z0-9_-]{6,}$/.test(u);

function clampStr(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function strList(v: unknown, min: number, max: number, maxLen: number): string[] | null {
  if (!Array.isArray(v)) return null;
  const items = v.map((x) => clampStr(x, maxLen)).filter(Boolean).slice(0, max);
  return items.length >= min ? items : null;
}

function validateDive(v: unknown): Omit<DeepDive, "source"> | null {
  if (typeof v !== "object" || v == null) return null;
  const o = v as Record<string, unknown>;
  const summary = clampStr(o.summary, 400);
  const reasons = strList(o.reasons, 2, 4, 260);
  const practice = strList(o.practice, 2, 5, 260);
  const steps = strList(o.steps, 3, 5, 260);
  if (!summary || !reasons || !practice || !steps) return null;
  let videos: DiveVideo[] = [];
  if (Array.isArray(o.videos)) {
    videos = o.videos
      .map((x) => {
        const r = x as { title?: unknown; url?: unknown };
        const url = clampStr(r?.url, 200);
        const title = clampStr(r?.title, 140) || "Watch explanation";
        return YT_OK(url) ? { title, url } : null;
      })
      .filter((x): x is DiveVideo => x !== null)
      .slice(0, 3);
  }
  return { summary, reasons, practice, steps, videos };
}

function statFor(pulse: Awaited<ReturnType<typeof studentPulse>>, subject: string) {
  return pulse?.subjects.find((s) => s.subject === subject) ?? null;
}

function localDive(
  subject: string,
  stat: { avg: number; count: number; trend: number } | null,
  weak: ChapterGap[]
): Omit<DeepDive, "source"> {
  const top = weak[0];
  const trendTxt =
    stat && stat.trend > 3
      ? " and is already trending up"
      : stat && stat.trend < -3
        ? " — recent tests dipped a little, which one good revision cycle can reverse"
        : "";

  const summary = !stat
    ? `No ${subject} scores yet — attempt your first ${subject} quiz and your personalised analysis will appear here.`
    : stat.avg >= 75
      ? `${subject} is going well at ${Math.round(stat.avg)}%${trendTxt}. Keep your routine and aim for mastery.`
      : `${subject} is at ${Math.round(stat.avg)}% across ${stat.count} assessment${stat.count > 1 ? "s" : ""}${trendTxt}. With focused work on ${top ? top.chapter : "a couple of chapters"}, the next level is within reach.`;

  const reasons: string[] = top
    ? [
        `${top.chapter} is at ${Math.round(top.pct)}% accuracy — the basics of this chapter are worth one quick revision.`,
        ...weak
          .slice(1, 3)
          .map((w) => `${w.chapter} needs another pass (${Math.round(w.pct)}% accuracy so far).`),
      ]
    : [`Chapter accuracies are healthy in ${subject} — no major gaps detected.`];

  if (stat && stat.trend < -3) {
    reasons.push(
      `Recent scores dipped by ${Math.round(Math.abs(stat.trend))} points — usually a sign of a few un-revised topics, not effort.`
    );
  }

  const practice = top
    ? [
        ...improveFor(top.subject, top.chapter).practice.slice(0, 2),
        `5 daily MCQs from ${top.chapter} until accuracy crosses 70%`,
        ...(weak[1] ? [`Re-solve your wrong questions from ${weak[1].chapter}`] : []),
      ]
    : [
        "Attempt one challenge question set to stay sharp",
        "Help a classmate explain a concept — it locks in your own learning",
      ];

  const steps = top
    ? [
        `Revise the core ideas of ${top.chapter} for 20 minutes`,
        "Redo the questions you got wrong, without looking at answers",
        "Take the 5-question diagnostic quiz for this chapter",
        "Re-test in 3 days — watch your accuracy climb",
      ]
    : [
        "Keep your current revision routine running",
        "Attempt one practice quiz weekly to stay sharp",
        "Pick one stretch topic to move from good to great",
        "Review your timeline every Friday",
      ];

  const videos: DiveVideo[] = [];
  for (const w of weak.slice(0, 2)) {
    const v = improveFor(w.subject, w.chapter).video;
    if (v && !videos.some((x) => x.url === v.url)) videos.push(v);
  }
  if (!videos.length) {
    const first = SYLLABUS[subject]?.[0];
    if (first) videos.push(improveFor(subject, first).video);
  }

  return { summary, reasons, practice, steps, videos };
}

function buildPrompt(
  subject: string,
  stat: { avg: number; count: number; trend: number } | null,
  weak: ChapterGap[],
  recent: { title: string; pct: number }[]
) {
  const data = {
    subject,
    overallAverage: stat ? Math.round(stat.avg) : null,
    assessments: stat?.count ?? 0,
    trend: stat ? Math.round(stat.trend) : null,
    chapters: weak.slice(0, 4).map((w) => ({
      chapter: w.chapter,
      accuracyPercent: Math.round(w.pct),
      recentWrongQuestions: w.wrong.slice(0, 2).map((x) => ({
        question: x.q,
        studentAnswer: x.yourAnswer,
        correctAnswer: x.correctAnswer,
      })),
    })),
    recentScores: recent.map((r) => ({ title: r.title, percent: Math.round(r.pct) })),
  };

  const system =
    "You are Vidyora's supportive learning coach for Indian school students (grades 6-9). " +
    "Analyse ONLY the real data provided — be specific to these chapters and questions, never generic. " +
    "Tone: warm, encouraging, growth-focused. Never label a child as weak, poor or failing; frame every gap as a clear, doable next step. " +
    "Reply with ONLY a JSON object, no markdown fences.";

  const schema = `{
  "summary": "one encouraging sentence (max 200 chars) about where the student stands in this subject",
  "reasons": ["2-4 short items: WHY progress is slow here, grounded in the actual wrong questions and chapter accuracies"],
  "practice": ["3-5 short items: WHAT to practise, naming concrete question types and chapters"],
  "steps": ["4-5 short items: ordered improvement steps the student can do this week"],
  "videos": [{"title": "topic-focused title", "url": "https://www.youtube.com/watch?v=VIDEO_ID"}]
}
Rules: videos = 2-3 REAL YouTube watch URLs you know for these exact topics; if unsure, return an empty array. All text in English.`;

  return {
    prompt: `Student data (JSON):\n${JSON.stringify(data)}\n\nReturn JSON as specified:\n${schema}`,
    system,
  };
}

export async function deepDiveFor(studentId: string, subject: string): Promise<DeepDive | null> {
  if (!(SUBJECTS as readonly string[]).includes(subject)) return null;

  const [pulse, gaps] = await Promise.all([studentPulse(studentId), learningGaps(studentId)]);
  const stat = statFor(pulse, subject);
  const weak = gaps.chapters.filter((c) => c.subject === subject && c.severity !== "strong");

  const statShape = stat ? { avg: stat.avg, count: stat.count, trend: stat.trend } : null;
  const local = localDive(subject, statShape, weak);

  const dbRows = await db.score.findMany({
    where: { studentId, assessment: { subject } },
    include: { assessment: { select: { title: true, maxMarks: true, date: true } } },
    orderBy: { assessment: { date: "desc" } },
    take: 4,
  });
  const recent = dbRows.map((s) => ({
    title: s.assessment.title,
    pct: s.assessment.maxMarks > 0 ? (s.marks / s.assessment.maxMarks) * 100 : 0,
  }));

  const { prompt, system } = buildPrompt(subject, statShape, weak, recent);
  const ai = await callGeminiJSON(
    {
      prompt,
      system,
      json: true,
      temperature: 0.5,
      maxTokens: 900,
      timeoutMs: 6000,
      retries: 0,
      cacheKey: `dive:${studentId}:${subject}`,
      cacheTtlMs: 15 * 60_000,
    },
    validateDive
  );

  if (ai) {
    const videos = [...ai.videos];
    for (const v of local.videos) {
      if (videos.length >= 2) break;
      if (!videos.some((x) => x.url === v.url)) videos.push(v);
    }
    return { ...ai, videos, source: "ai" };
  }

  return { ...local, source: "local" };
}
