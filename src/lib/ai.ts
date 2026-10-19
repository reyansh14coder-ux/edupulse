import { db } from "@/lib/db";
import { studentPulse } from "@/lib/insights";
import { BANK, SYLLABUS, type BankQuestion } from "@/lib/question-bank";

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

  return recs.slice(0, 6);
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

  if (existing.length) await db.recommendation.deleteMany({ where: { studentId } });
  const recs = await buildRecommendations(studentId);
  if (recs.length) {
    await db.recommendation.createMany({
      data: recs.map((r) => ({ ...r, studentId })),
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

export async function createClassQuiz(input: {
  classId: string;
  subject: string;
  chapter?: string | null;
  createdById?: string;
}) {
  const questions: BankQuestion[] = pickQuizQuestions(input.subject, input.chapter);
  const title = input.chapter
    ? `${input.subject} – ${input.chapter} (Practice Quiz)`
    : `${input.subject} – AI Practice Quiz`;
  return db.quiz.create({
    data: {
      title,
      classId: input.classId,
      subject: input.subject,
      chapter: input.chapter ?? null,
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

  return createClassQuiz({
    classId: pulse.student.classId,
    subject: weakest,
    chapter: weakChapter,
  });
}

export function draftPlan(rec: {
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
