import { db } from "@/lib/db";
import { learningGaps } from "@/lib/gaps";
import { studentPulse } from "@/lib/insights";

export type NextBestAction = {
  title: string;
  detail: string;
  reason: string;
  cta: { label: string; href: string };
  tone: "brand" | "warning" | "info" | "success";
};

export async function nextBestAction(studentId: string): Promise<NextBestAction> {
  const [gaps, pulse, overdue] = await Promise.all([
    learningGaps(studentId),
    studentPulse(studentId),
    db.homeworkSubmission.findFirst({
      where: { studentId, status: "PENDING", homework: { dueDate: { lt: new Date() } } },
      include: { homework: { select: { title: true, subject: true } } },
      orderBy: { homework: { dueDate: "asc" } },
    }),
  ]);

  if (overdue) {
    return {
      title: `Finish "${overdue.homework.title}" (${overdue.homework.subject})`,
      detail:
        "It is past its due date — submitting today clears one pending task and keeps your activity record healthy.",
      reason: "Overdue activity",
      cta: { label: "Open homework", href: "/student/homework" },
      tone: "warning",
    };
  }

  const worst = gaps.weakest;
  if (worst && worst.pct < 55) {
    return {
      title: `Practise ${worst.chapter} (${worst.subject}) — you're at ${worst.pct}% here`,
      detail:
        "Twenty focused minutes here will lift your average the fastest. Take the AI quiz afterwards to lock it in.",
      reason: "Biggest learning gap",
      cta: { label: "Open my plan", href: "/student/plan" },
      tone: "brand",
    };
  }

  if (pulse && pulse.attendancePct < 75) {
    return {
      title: `Attend school for the next few days — attendance is at ${Math.round(pulse.attendancePct)}%`,
      detail:
        "Regular attendance alone will lift your standing before the next assessment — no extra study needed for this one.",
      reason: "Attendance",
      cta: { label: "See my dashboard", href: "/student" },
      tone: "warning",
    };
  }

  return {
    title: "Take an AI practice quiz on your focus chapter",
    detail:
      "You're on track — a quick quiz this week keeps the momentum and feeds fresh data into your plan.",
    reason: "Stay consistent",
    cta: { label: "Open quizzes", href: "/student/quizzes" },
    tone: "success",
  };
}
