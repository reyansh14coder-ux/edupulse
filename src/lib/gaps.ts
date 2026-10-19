import { db } from "@/lib/db";

export type ChapterGap = {
  subject: string;
  chapter: string;
  correct: number;
  total: number;
  pct: number;
  severity: "weak" | "review" | "strong";
};

function severityOf(pct: number): ChapterGap["severity"] {
  if (pct < 50) return "weak";
  if (pct < 75) return "review";
  return "strong";
}

export async function learningGaps(studentId: string) {
  const attempts = await db.quizAttempt.findMany({
    where: { studentId },
    include: { quiz: { select: { subject: true, questions: true } } },
    orderBy: { createdAt: "asc" },
  });

  const map = new Map<string, ChapterGap>();

  for (const attempt of attempts) {
    let questions: { chapter?: string }[] = [];
    let detail: { correct?: boolean }[] = [];
    try {
      questions = JSON.parse(attempt.quiz.questions);
      detail = JSON.parse(attempt.detail);
    } catch {
      continue;
    }
    questions.forEach((q, i) => {
      const chapter = q.chapter || "General";
      const key = `${attempt.quiz.subject}::${chapter}`;
      const entry =
        map.get(key) ??
        ({
          subject: attempt.quiz.subject,
          chapter,
          correct: 0,
          total: 0,
          pct: 0,
          severity: "strong",
        } satisfies ChapterGap);
      entry.total += 1;
      if (detail[i]?.correct) entry.correct += 1;
      entry.pct = entry.total ? (entry.correct / entry.total) * 100 : 0;
      entry.severity = severityOf(entry.pct);
      map.set(key, entry);
    });
  }

  const chapters = [...map.values()]
    .filter((c) => c.total >= 2)
    .sort((a, b) => a.pct - b.pct);

  const bySubjectMap = new Map<string, { correct: number; total: number }>();
  for (const c of chapters) {
    const agg = bySubjectMap.get(c.subject) ?? { correct: 0, total: 0 };
    agg.correct += c.correct;
    agg.total += c.total;
    bySubjectMap.set(c.subject, agg);
  }
  const bySubject = [...bySubjectMap.entries()]
    .map(([subject, a]) => ({ subject, pct: a.total ? (a.correct / a.total) * 100 : 0 }))
    .sort((a, b) => a.pct - b.pct);

  const weak = chapters.filter((c) => c.severity !== "strong");

  return {
    chapters,
    weak,
    bySubject,
    weakest: chapters.find((c) => c.severity === "weak") ?? chapters[0] ?? null,
    attempted: attempts.length,
  };
}
