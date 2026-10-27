import { db } from "@/lib/db";
import { callGeminiJSON } from "@/lib/gemini";

export type GradeOption = { name: string; sections: { id: string; section: string; name: string }[] };

/** Groups classes into grades -> sections. Grade = class name (e.g. "Class 9"). */
export async function gradeTree(): Promise<GradeOption[]> {
  const classes = await db.schoolClass.findMany({ orderBy: [{ name: "asc" }, { section: "asc" }] });
  const map = new Map<string, GradeOption>();
  for (const c of classes) {
    const g = map.get(c.name) ?? { name: c.name, sections: [] };
    g.sections.push({ id: c.id, section: c.section, name: `${c.name} ${c.section}` });
    map.set(c.name, g);
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export type TeacherPerf = {
  id: string;
  name: string;
  title: string | null;
  email: string;
  classes: string[];
  subjects: string[];
  students: number;
  avgScore: number;
  goodPct: number;
  attendancePct: number;
  homeworkCount: number;
  sessionCount: number;
  complaints: number;
  praises: number;
  weeklyDelta: number;
  score: number;
};

/** How well each teacher's students are performing, plus complaint/review counts. */
export async function teacherPerformance(): Promise<TeacherPerf[]> {
  const teachers = await db.user.findMany({
    where: { role: "TEACHER" },
    include: {
      teaching: { include: { schoolClass: { include: { students: true } } } },
      homeworks: true,
      counseling: true,
      feedbackAbout: true,
    },
    orderBy: { name: "asc" },
  });

  const now = Date.now();
  const fourteen = now - 14 * 864e5;
  const twentyEight = now - 28 * 864e5;

  const out: TeacherPerf[] = [];
  for (const t of teachers) {
    const classes = [...new Set(t.teaching.map((a) => `${a.schoolClass.name} ${a.schoolClass.section}`))];
    const subjects = [...new Set(t.teaching.map((a) => a.subject))];
    const studentIds = new Set(t.teaching.flatMap((a) => a.schoolClass.students.map((s) => s.id)));

    const [scores, attendance, homeworkCount] = await Promise.all([
      db.score.findMany({
        where: { studentId: { in: [...studentIds] } },
        include: { assessment: true },
      }),
      db.attendance.findMany({ where: { studentId: { in: [...studentIds] } } }),
      db.homework.count({ where: { assignedById: t.id, assignedOn: { gte: new Date(twentyEight) } } }),
    ]);

    // per-student average -> teacher avg + good%
    const perStudent = new Map<string, { marks: number; max: number }>();
    for (const s of scores) {
      const e = perStudent.get(s.studentId) ?? { marks: 0, max: 0 };
      e.marks += s.marks;
      e.max += s.assessment.maxMarks;
      perStudent.set(s.studentId, e);
    }
    const avgs = [...perStudent.values()].map((e) =>
      e.max > 0 ? (e.marks / e.max) * 100 : 0
    );
    const avgScore = avgs.length ? avgs.reduce((a, b) => a + b, 0) / avgs.length : 0;
    const goodPct = avgs.length ? (avgs.filter((a) => a >= 75).length / avgs.length) * 100 : 0;

    const attPct = attendance.length
      ? (attendance.filter((a) => a.status !== "ABSENT").length / attendance.length) * 100
      : 100;

    // weekly delta: last 14d avg vs prior 14d
    const recent = scores.filter((s) => new Date(s.assessment.date).getTime() >= fourteen);
    const prior = scores.filter((s) => {
      const d = new Date(s.assessment.date).getTime();
      return d >= twentyEight && d < fourteen;
    });
    const wAvg = (arr: typeof scores) => {
      const m = arr.reduce((a, s) => a + s.marks, 0);
      const mx = arr.reduce((a, s) => a + s.assessment.maxMarks, 0);
      return mx > 0 ? (m / mx) * 100 : 0;
    };
    const rAvg = wAvg(recent);
    const pAvg = wAvg(prior);
    const weeklyDelta = prior.length && recent.length ? rAvg - pAvg : 0;

    const complaints = t.feedbackAbout.filter((f) => f.category === "COMPLAINT" && f.status !== "RESOLVED").length;
    const praises = t.feedbackAbout.filter((f) => f.category === "PRAISE").length;

    const base = avgScore * 0.5 + attPct * 0.25 + goodPct * 0.25;
    const score = Math.max(0, Math.min(100, Math.round(base - complaints * 4)));

    out.push({
      id: t.id,
      name: t.name,
      title: t.title,
      email: t.email,
      classes,
      subjects,
      students: studentIds.size,
      avgScore,
      goodPct,
      attendancePct: attPct,
      homeworkCount,
      sessionCount: t.counseling.length,
      complaints,
      praises,
      weeklyDelta,
      score,
    });
  }
  return out.sort((a, b) => b.score - a.score);
}

export type SchoolWeekReport = {
  summary: string;
  highlights: string[];
  concerns: string[];
  actions: string[];
  source: "ai" | "local";
};

/** Weekly "what's going on in the school" report for the admin. */
export async function schoolWeeklyReport(teachers: TeacherPerf[]): Promise<SchoolWeekReport> {
  const [scores, attendance, interventions, feedback, sessions] = await Promise.all([
    db.score.findMany({ include: { assessment: true } }),
    db.attendance.findMany(),
    db.studentIntervention.count(),
    db.teacherFeedback.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    db.counselingSession.count(),
  ]);

  const totalMarks = scores.reduce((a, s) => a + s.marks, 0);
  const totalMax = scores.reduce((a, s) => a + s.assessment.maxMarks, 0);
  const overall = totalMax > 0 ? (totalMarks / totalMax) * 100 : 0;
  const attPct = attendance.length
    ? (attendance.filter((a) => a.status !== "ABSENT").length / attendance.length) * 100
    : 100;
  const openComplaints = feedback.filter((f) => f.category === "COMPLAINT" && f.status !== "RESOLVED").length;
  const topTeachers = teachers.slice(0, 3).map((t) => `${t.name} (${Math.round(t.score)}%)`);
  const lowTeachers = teachers.filter((t) => t.score < 60).map((t) => t.name);

  const local: SchoolWeekReport = {
    summary: `School average is ${Math.round(overall)}% with ${Math.round(attPct)}% attendance this term. ${teachers.length} teachers are running ${new Set(teachers.flatMap((t) => t.classes)).size} classes. ${openComplaints ? `${openComplaints} open teacher feedback item(s) need review.` : "No open teacher complaints."}`,
    highlights: [
      `Top performing teachers: ${topTeachers.join(", ") || "—"}`,
      `${interventions} student support steps logged`,
      `${sessions} counseling sessions on record`,
    ],
    concerns: [
      ...(lowTeachers.length ? [`Teachers to check in with: ${lowTeachers.join(", ")}`] : []),
      ...(attPct < 80 ? [`School attendance is ${Math.round(attPct)}% — below the 80% healthy line`] : []),
      ...(openComplaints ? [`${openComplaints} open teacher complaint(s) awaiting admin review`] : []),
    ],
    actions: [
      "Review open teacher feedback and resolve or escalate.",
      "Recognise top teachers; support those below 60%.",
      "Follow up on students flagged for attention this week.",
    ],
    source: "local",
  };

  const ai = await callGeminiJSON<{ summary: string; highlights: string[]; concerns: string[]; actions: string[] }>(
    {
      prompt: `School weekly analytics (JSON): ${JSON.stringify({
        overallAveragePercent: Math.round(overall),
        attendancePercent: Math.round(attPct),
        teachers: teachers.map((t) => ({
          name: t.name,
          score: t.score,
          classAvg: Math.round(t.avgScore),
          goodStudentsPct: Math.round(t.goodPct),
          complaints: t.complaints,
        })),
        openComplaints,
        interventions,
        counselingSessions: sessions,
      })}

Return ONLY {"summary":"...","highlights":["..."],"concerns":["..."],"actions":["..."]}.`,
      system:
        "You write the weekly school report for a school principal (admin) on Vidyora. " +
        "Summary: 2-3 supportive, data-grounded sentences on how the school is doing overall. " +
        "Highlights: 2-4 things going well. Concerns: 1-3 honest issues (teacher performance, attendance, complaints). " +
        "Actions: 2-4 concrete steps for the admin this week. Evidence-led, never harsh or personal. Plain English, no markdown.",
      json: true,
      temperature: 0.5,
      maxTokens: 700,
      timeoutMs: 5000,
      retries: 0,
      cacheKey: "school:week",
      cacheTtlMs: 30 * 60_000,
    },
    (v) => {
      const o = v as { summary?: unknown; highlights?: unknown; concerns?: unknown; actions?: unknown };
      const s = typeof o?.summary === "string" ? o.summary.replace(/\s+/g, " ").trim().slice(0, 500) : "";
      const arr = (x: unknown) => (Array.isArray(x) ? x.filter((y): y is string => typeof y === "string").map((y) => y.replace(/\s+/g, " ").trim().slice(0, 200)).filter(Boolean).slice(0, 5) : []);
      const h = arr(o?.highlights), c = arr(o?.concerns), a = arr(o?.actions);
      return s.length >= 60 && h.length >= 1 && a.length >= 1 ? { summary: s, highlights: h, concerns: c, actions: a } : null;
    }
  );

  if (ai) return { ...ai, source: "ai" };
  return local;
}
