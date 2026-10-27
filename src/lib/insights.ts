import { db } from "@/lib/db";
import { isoDate } from "@/lib/utils";
import { REPORT_COPY, localeOf, type Lang } from "@/lib/report-i18n";
import { learningGaps } from "@/lib/gaps";
import { callGeminiJSON } from "@/lib/gemini";

export type SubjectStat = {
  subject: string;
  avg: number;
  count: number;
  trend: number;
};

export type Flag = {
  severity: "high" | "medium" | "low" | "good";
  message: string;
};

function pctOf(marks: number, max: number) {
  return max > 0 ? (marks / max) * 100 : 0;
}

function subjectStats(
  rows: { subject: string; pct: number; date: Date; maxMarks: number }[]
): SubjectStat[] {
  const bySubject = new Map<string, typeof rows>();
  for (const r of rows) {
    const arr = bySubject.get(r.subject) ?? [];
    arr.push(r);
    bySubject.set(r.subject, arr);
  }
  const weightedAvg = (rows: { pct: number; maxMarks: number }[]) => {
    const weight = rows.reduce((s, r) => s + r.maxMarks, 0);
    return weight > 0
      ? rows.reduce((s, r) => s + (r.pct * r.maxMarks) / 100, 0) / weight * 100
      : 0;
  };
  const stats: SubjectStat[] = [];
  for (const [subject, arr] of bySubject) {
    const sorted = [...arr].sort((a, b) => a.date.getTime() - b.date.getTime());
    const avg = weightedAvg(sorted);
    const half = Math.floor(sorted.length / 2);
    let trend = 0;
    if (sorted.length >= 4) {
      const earlier = weightedAvg(sorted.slice(0, half));
      const recent = weightedAvg(sorted.slice(sorted.length - half));
      trend = recent - earlier;
    }
    stats.push({ subject, avg, count: sorted.length, trend });
  }
  return stats.sort((a, b) => b.avg - a.avg);
}

export async function studentPulse(studentId: string) {
  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      user: true,
      schoolClass: true,
      scores: { include: { assessment: true }, orderBy: { assessment: { date: "asc" } } },
      attendance: { orderBy: { date: "desc" } },
      submissions: { include: { homework: true } },
      guidance: { include: { author: true }, orderBy: { createdAt: "desc" } },
      counseling: { include: { counselor: true }, orderBy: { scheduledFor: "desc" } },
      parentLinks: { include: { parent: true } },
    },
  });
  if (!student) return null;

  const rows = student.scores.map((s) => ({
    subject: s.assessment.subject,
    pct: pctOf(s.marks, s.assessment.maxMarks),
    date: s.assessment.date,
    maxMarks: s.assessment.maxMarks,
    title: s.assessment.title,
    marks: s.marks,
    max: s.assessment.maxMarks,
    assessmentId: s.assessmentId,
  }));

  const totalMarks = student.scores.reduce((s, x) => s + x.marks, 0);
  const totalMax = student.scores.reduce((s, x) => s + x.assessment.maxMarks, 0);
  const overall = totalMax > 0 ? (totalMarks / totalMax) * 100 : 0;

  const weightedOf = (rs: typeof rows) => {
    const m = rs.reduce((s, r) => s + r.marks, 0);
    const mx = rs.reduce((s, r) => s + r.max, 0);
    return mx > 0 ? (m / mx) * 100 : overall;
  };
  const recent = rows.slice(-4);
  const earlier = rows.slice(0, Math.max(rows.length - 4, 0));
  const recentAvg = recent.length ? weightedOf(recent) : overall;
  const earlierAvg = earlier.length ? weightedOf(earlier) : overall;
  const delta = earlier.length ? recentAvg - earlierAvg : 0;

  const subjects = subjectStats(rows);

  const today = new Date();
  const since30 = new Date(today.getTime() - 30 * 864e5);
  const allDays = student.attendance;
  const presentCount = allDays.filter((a) => a.status !== "ABSENT").length;
  const attendancePct = allDays.length ? (presentCount / allDays.length) * 100 : 100;
  const recentDays = allDays.filter((a) => a.date >= since30);
  const recentPresent = recentDays.filter((a) => a.status !== "ABSENT").length;
  const recentAttendance = recentDays.length
    ? (recentPresent / recentDays.length) * 100
    : 100;
  const recentAbsents = allDays
    .filter((a) => a.status === "ABSENT" && a.date >= since30)
    .slice(0, 5);

  const assignedHw = student.submissions.length;
  const doneHw = student.submissions.filter((s) => s.status !== "PENDING").length;
  const pendingHw = student.submissions
    .filter((s) => s.status === "PENDING")
    .sort((a, b) => a.homework.dueDate.getTime() - b.homework.dueDate.getTime())
    .slice(0, 6);
  const overdueHw = pendingHw.filter(
    (s) => s.homework.dueDate.getTime() < today.getTime()
  );

  const classAvg = await classAverage(student.classId);

  let rank = 0;
  const classmates = await db.student.findMany({
    where: { classId: student.classId },
    include: { scores: { include: { assessment: true } } },
  });
  const ranked = classmates
    .map((c) => {
      const m = c.scores.reduce((s, x) => s + x.marks, 0);
      const mx = c.scores.reduce((s, x) => s + x.assessment.maxMarks, 0);
      return { id: c.id, avg: mx > 0 ? (m / mx) * 100 : 0 };
    })
    .sort((a, b) => b.avg - a.avg);
  rank = ranked.findIndex((r) => r.id === studentId) + 1;

  const flags: Flag[] = [];
  if (overall < 50)
    flags.push({
      severity: "high",
      message: `Overall average is ${Math.round(overall)}% — below the 50% support threshold.`,
    });
  if (attendancePct < 75)
    flags.push({
      severity: "high",
      message: `Attendance at ${Math.round(attendancePct)}% — below the 75% requirement.`,
    });
  if (delta <= -8)
    flags.push({
      severity: "medium",
      message: `Performance dipped ${Math.round(Math.abs(delta))} points in recent assessments.`,
    });
  if (overdueHw.length >= 2)
    flags.push({
      severity: "medium",
      message: `${overdueHw.length} homework submissions are overdue.`,
    });
  const weak = subjects.filter((s) => s.avg < 45);
  for (const w of weak.slice(0, 2))
    flags.push({
      severity: "medium",
      message: `Needs additional support in ${w.subject} (avg ${Math.round(w.avg)}%).`,
    });
  const declining = subjects.filter((s) => s.trend <= -10);
  for (const d of declining.slice(0, 1))
    flags.push({
      severity: "low",
      message: `${d.subject} shows a declining trend (${Math.round(d.trend)} pts).`,
    });
  if (!flags.length)
    flags.push({
      severity: "good",
      message: "Steady progress across subjects — keep the momentum going.",
    });

  const strengths = subjects.slice(0, 2).map((s) => ({
    subject: s.subject,
    avg: Math.round(s.avg),
  }));
  const focus = [...subjects].reverse().slice(0, 2).map((s) => ({
    subject: s.subject,
    avg: Math.round(s.avg),
  }));

  const trendSeries = rows.map((r) => ({
    label: isoDate(r.date),
    value: Math.round(r.pct),
    title: r.title,
    subject: r.subject,
  }));

  return {
    student,
    overall,
    recentAvg,
    delta,
    subjects,
    attendancePct,
    recentAttendance,
    recentAbsents,
    homeworkDone: doneHw,
    homeworkTotal: assignedHw,
    pendingHw,
    overdueHw,
    classAvg,
    rank,
    totalInClass: classmates.length,
    flags,
    strengths,
    focus,
    trendSeries,
    recentRows: rows.slice(-6).reverse(),
  };
}

export async function classAverage(classId: string) {
  const rows = await db.score.findMany({
    where: { student: { classId }, assessment: { classId } },
    select: { marks: true, assessment: { select: { maxMarks: true } } },
  });
  const total = rows.reduce((s, r) => s + r.marks, 0);
  const max = rows.reduce((s, r) => s + r.assessment.maxMarks, 0);
  return max > 0 ? (total / max) * 100 : 0;
}

export async function schoolPulse() {
  const [students, teachers, classes, scores, attendance, assessments] =
    await Promise.all([
      db.student.count(),
      db.user.count({ where: { role: "TEACHER" } }),
      db.schoolClass.count(),
      db.score.findMany({
        include: { assessment: true, student: { include: { schoolClass: true } } },
      }),
      db.attendance.findMany(),
      db.assessment.findMany({ orderBy: { date: "asc" } }),
    ]);

  const totalMarks = scores.reduce((s, x) => s + x.marks, 0);
  const totalMax = scores.reduce((s, x) => s + x.assessment.maxMarks, 0);
  const overall = totalMax > 0 ? (totalMarks / totalMax) * 100 : 0;

  const present = attendance.filter((a) => a.status !== "ABSENT").length;
  const attendancePct = attendance.length
    ? (present / attendance.length) * 100
    : 100;

  const bySubject = new Map<
    string,
    { marks: number; max: number; n: number }
  >();
  for (const s of scores) {
    const k = s.assessment.subject;
    const e = bySubject.get(k) ?? { marks: 0, max: 0, n: 0 };
    e.marks += s.marks;
    e.max += s.assessment.maxMarks;
    e.n += 1;
    bySubject.set(k, e);
  }
  const subjects = [...bySubject.entries()]
    .map(([subject, e]) => ({
      subject,
      avg: e.max > 0 ? (e.marks / e.max) * 100 : 0,
      count: e.n,
    }))
    .sort((a, b) => b.avg - a.avg);

  const byClass = new Map<string, { marks: number; max: number; name: string }>();
  for (const s of scores) {
    const k = s.student.classId;
    const e =
      byClass.get(k) ?? {
        marks: 0,
        max: 0,
        name: `${s.student.schoolClass.name} ${s.student.schoolClass.section}`,
      };
    e.marks += s.marks;
    e.max += s.assessment.maxMarks;
    byClass.set(k, e);
  }
  const classAvgs = [...byClass.values()]
    .map((e) => ({ name: e.name, avg: e.max > 0 ? (e.marks / e.max) * 100 : 0 }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const byMonth = new Map<string, { marks: number; max: number }>();
  for (const s of assessments) {
    const key = isoDate(s.date).slice(0, 7);
    const rows = scores.filter((x) => x.assessmentId === s.id);
    const e = byMonth.get(key) ?? { marks: 0, max: 0 };
    for (const r of rows) {
      e.marks += r.marks;
      e.max += s.maxMarks;
    }
    if (e.max > 0) byMonth.set(key, e);
  }
  const monthly = [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, e]) => ({ month, value: Math.round((e.marks / e.max) * 100) }));

  const allStudents = await db.student.findMany({
    include: {
      user: true,
      schoolClass: true,
      scores: { include: { assessment: true } },
      attendance: true,
      submissions: { include: { homework: true } },
    },
  });
  const atRisk = allStudents
    .map((st) => {
      const m = st.scores.reduce((s, x) => s + x.marks, 0);
      const mx = st.scores.reduce((s, x) => s + x.assessment.maxMarks, 0);
      const avg = mx > 0 ? (m / mx) * 100 : 0;
      const att = st.attendance.length
        ? (st.attendance.filter((a) => a.status !== "ABSENT").length /
            st.attendance.length) *
          100
        : 100;
      const overdue = st.submissions.filter(
        (s) => s.status === "PENDING" && s.homework.dueDate.getTime() < Date.now()
      ).length;
      const reasons: string[] = [];
      if (avg < 50) reasons.push(`Avg ${Math.round(avg)}%`);
      if (att < 75) reasons.push(`Attendance ${Math.round(att)}%`);
      if (overdue >= 2) reasons.push(`${overdue} overdue homework`);
      return {
        id: st.id,
        name: st.user.name,
        className: `${st.schoolClass.name} ${st.schoolClass.section}`,
        avg,
        attendance: att,
        reasons,
      };
    })
    .filter((s) => s.reasons.length)
    .sort((a, b) => a.avg - b.avg);

  return {
    students,
    teachers,
    classes,
    overall,
    attendancePct,
    subjects,
    classAvgs,
    monthly,
    atRisk,
  };
}

export async function teacherPulse(teacherId: string) {
  const assignments = await db.teacherAssignment.findMany({
    where: { teacherId },
    include: { schoolClass: { include: { students: true } } },
  });
  const classIds = [...new Set(assignments.map((a) => a.classId))];

  const scores = await db.score.findMany({
    where: { student: { classId: { in: classIds } }, assessment: { classId: { in: classIds } } },
    include: { assessment: true, student: { include: { user: true, schoolClass: true } } },
  });

  const tTotal = scores.reduce((s, x) => s + x.marks, 0);
  const tMax = scores.reduce((s, x) => s + x.assessment.maxMarks, 0);
  const overall = tMax > 0 ? (tTotal / tMax) * 100 : 0;

  const attendance = await db.attendance.findMany({
    where: { student: { classId: { in: classIds } } },
  });
  const attendancePct = attendance.length
    ? (attendance.filter((a) => a.status !== "ABSENT").length /
        attendance.length) *
      100
    : 100;

  const recentAssessments = await db.assessment.findMany({
    where: { classId: { in: classIds } },
    orderBy: { date: "desc" },
    take: 5,
    include: { scores: true },
  });

  const subjectsTaught = [...new Set(assignments.map((a) => a.subject))];

  const subjectMap = new Map<string, { marks: number; max: number; n: number }>();
  for (const s of scores) {
    const k = s.assessment.subject;
    const e = subjectMap.get(k) ?? { marks: 0, max: 0, n: 0 };
    e.marks += s.marks;
    e.max += s.assessment.maxMarks;
    e.n += 1;
    subjectMap.set(k, e);
  }
  const subjects = [...subjectMap.entries()]
    .map(([subject, e]) => ({
      subject,
      avg: e.max > 0 ? (e.marks / e.max) * 100 : 0,
      count: e.n,
    }))
    .sort((a, b) => b.avg - a.avg);

  const monthMap = new Map<string, { marks: number; max: number }>();
  for (const s of scores) {
    const key = isoDate(s.assessment.date).slice(0, 7);
    const e = monthMap.get(key) ?? { marks: 0, max: 0 };
    e.marks += s.marks;
    e.max += s.assessment.maxMarks;
    monthMap.set(key, e);
  }
  const trend = [...monthMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, e]) => ({
      month,
      value: e.max > 0 ? Math.round((e.marks / e.max) * 100) : 0,
    }));

  const ownStudents = await db.student.findMany({
    where: { classId: { in: classIds } },
    include: {
      user: true,
      schoolClass: true,
      scores: { include: { assessment: true } },
      attendance: true,
      submissions: { include: { homework: true } },
    },
  });
  const atRisk = ownStudents
    .map((st) => {
      const m = st.scores.reduce((s, x) => s + x.marks, 0);
      const mx = st.scores.reduce((s, x) => s + x.assessment.maxMarks, 0);
      const avg = mx > 0 ? (m / mx) * 100 : 0;
      const att = st.attendance.length
        ? (st.attendance.filter((a) => a.status !== "ABSENT").length /
            st.attendance.length) *
          100
        : 100;
      const overdue = st.submissions.filter(
        (s) => s.status === "PENDING" && s.homework.dueDate.getTime() < Date.now()
      ).length;
      const reasons: string[] = [];
      if (avg < 50) reasons.push(`Avg ${Math.round(avg)}%`);
      if (att < 75) reasons.push(`Attendance ${Math.round(att)}%`);
      if (overdue >= 2) reasons.push(`${overdue} overdue homework`);
      return {
        id: st.id,
        name: st.user.name,
        className: `${st.schoolClass.name} ${st.schoolClass.section}`,
        roll: st.rollNo,
        avg,
        attendance: att,
        reasons,
      };
    })
    .filter((s) => s.reasons.length)
    .sort((a, b) => a.avg - b.avg);

  const pendingScores = await db.assessment.findMany({
    where: { classId: { in: classIds }, subject: { in: subjectsTaught } },
    include: { _count: { select: { scores: true } } },
    orderBy: { date: "desc" },
    take: 10,
  });

  return {
    assignments,
    classIds,
    overall,
    attendancePct,
    recentAssessments,
    subjects,
    trend,
    atRisk,
    subjectsTaught,
    studentCount: assignments.reduce((s, a) => s + a.schoolClass.students.length, 0),
    recentAssessmentRows: recentAssessments,
    pendingScores: pendingScores.filter((a) => a._count.scores === 0),
  };
}

export type WeeklyReport = {
  periodLabel: string;
  attendance: { present: number; total: number; pct: number; absents: string[] };
  assessments: {
    title: string;
    subject: string;
    date: string;
    score: string;
    pct: number;
  }[];
  homework: { title: string; subject: string; due: string; status: string }[];
  highlights: string[];
  concerns: string[];
  focusNext: string;
  overall: number;
  summary: string;
  delta: number | null;
  weekAvg: number | null;
  plans: { title: string; plan: string }[];
  general: {
    studies: string;
    achievements: string[];
    focus: string[];
    advice: string;
  };
  subjects: {
    subject: string;
    avg: number;
    count: number;
    trend: number;
    weakChapters: string[];
    rec: string;
    action: string;
  }[];
  behaviour: { title: string; note: string | null; date: string }[];
  activities: { title: string; note: string | null; date: string }[];
  notes: {
    id: string;
    kind: "Teacher" | "Counselor";
    author: string;
    category: string;
    title: string;
    excerpt: string;
    date: string;
  }[];
};

export async function weeklyReport(
  studentId: string,
  lang: Lang = "en"
): Promise<WeeklyReport | null> {
  const t = REPORT_COPY[lang];
  const locale = localeOf(lang);
  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      user: true,
      schoolClass: { include: { assignments: true } },
      scores: { include: { assessment: true } },
      attendance: true,
      submissions: { include: { homework: true } },
      guidance: { include: { author: true }, orderBy: { createdAt: "desc" }, take: 3 },
    },
  });
  if (!student) return null;

  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const weekEnd = new Date(monday);
  weekEnd.setDate(monday.getDate() + 7);

  const inWeek = (d: Date) => d >= monday && d < weekEnd;

  const weekAttendance = student.attendance.filter((a) => inWeek(a.date));
  const present = weekAttendance.filter((a) => a.status !== "ABSENT").length;
  const attPct = weekAttendance.length ? (present / weekAttendance.length) * 100 : 100;
  const absents = weekAttendance
    .filter((a) => a.status === "ABSENT")
    .map((a) => a.date.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "short" }));

  const prevMonday = new Date(monday);
  prevMonday.setDate(monday.getDate() - 7);
  const prevScores = student.scores.filter(
    (s) => s.assessment.date >= prevMonday && s.assessment.date < monday
  );

  const weekAssessments = student.scores
    .filter((s) => inWeek(s.assessment.date))
    .sort((a, b) => a.assessment.date.getTime() - b.assessment.date.getTime());

  const totalMarks = student.scores.reduce((s, x) => s + x.marks, 0);
  const totalMax = student.scores.reduce((s, x) => s + x.assessment.maxMarks, 0);
  const overall = totalMax > 0 ? (totalMarks / totalMax) * 100 : 0;

  const homeworkDue = student.submissions
    .filter((s) => inWeek(s.homework.dueDate) || inWeek(s.homework.assignedOn))
    .slice(0, 8);

  const scored = weekAssessments.map((s) => ({
    title: s.assessment.title,
    subject: s.assessment.subject,
    date: isoDate(s.assessment.date),
    score: `${s.marks} / ${s.assessment.maxMarks}`,
    pct: pctOf(s.marks, s.assessment.maxMarks),
  }));

  const highlights: string[] = [];
  const concerns: string[] = [];
  const best = [...scored].sort((a, b) => b.pct - a.pct)[0];
  if (best) highlights.push(t.hBest(Math.round(best.pct), best.subject, best.title));
  if (attPct >= 95) highlights.push(t.hPerfect);
  if (present === weekAttendance.length && weekAttendance.length > 0)
    highlights.push(t.hPresentAll);
  if (!scored.length) highlights.push(t.hSteady);

  const worst = [...scored].sort((a, b) => a.pct - b.pct)[0];
  if (worst && worst.pct < 50)
    concerns.push(t.cWorst(worst.subject, worst.title, Math.round(worst.pct)));
  if (absents.length >= 2) concerns.push(t.cAbsent(absents.length));
  const pending = homeworkDue.filter((h) => h.status === "PENDING");
  if (pending.length) concerns.push(t.cPending(pending.length));

  const bySubject = subjectStats(
    student.scores.map((s) => ({
      subject: s.assessment.subject,
      pct: pctOf(s.marks, s.assessment.maxMarks),
      date: s.assessment.date,
      maxMarks: s.assessment.maxMarks,
    }))
  );
  const weakest = bySubject[bySubject.length - 1];
  const focusNext = weakest
    ? t.focusLine(weakest.subject, Math.round(weakest.avg))
    : t.focusNone;

  const healthy = lang === "hi"
    ? "प्रदर्शन और भागीदारी दोनों इस हफ़्ते स्वस्थ हैं।"
    : lang === "mr"
      ? "प्रदर्शन व सहभागिता दोन्ही या आठवड्यात निरोगी आहेत."
      : "Performance and participation are both healthy this week.";
  const summary = t.summary(
    student.user.name,
    Math.round(overall),
    Math.round(attPct),
    concerns.length,
    healthy
  );

  const weightedOf = (arr: typeof student.scores) => {
    const m = arr.reduce((s, x) => s + x.marks, 0);
    const mx = arr.reduce((s, x) => s + x.assessment.maxMarks, 0);
    return mx > 0 ? (m / mx) * 100 : null;
  };
  const weekAvg = weekAssessments.length ? weightedOf(weekAssessments) : null;
  const prevAvg = prevScores.length ? weightedOf(prevScores) : null;
  const delta = weekAvg !== null && prevAvg !== null ? weekAvg - prevAvg : null;

  const plans = await db.recommendation.findMany({
    where: { studentId, planStatus: "APPROVED", plan: { not: null } },
    select: { title: true, plan: true },
    orderBy: { updatedAt: "desc" },
    take: 4,
  });

  const [gaps, doneGoals, counseling, weekActivities] = await Promise.all([
    learningGaps(studentId),
    db.studentGoal.count({
      where: { studentId, kind: "GOAL", status: "DONE" },
    }),
    db.counselingSession.findMany({
      where: { studentId, notes: { not: null } },
      include: { counselor: { select: { name: true } } },
      orderBy: { scheduledFor: "desc" },
      take: 2,
    }),
    db.studentActivity.findMany({
      where: { studentId, date: { gte: monday, lt: weekEnd } },
      orderBy: { date: "desc" },
      take: 8,
    }),
  ]);

  const behaviour = weekActivities
    .filter((a) => a.kind === "BEHAVIOUR")
    .map((a) => ({
      title: a.title,
      note: a.note,
      date: isoDate(a.date),
    }));
  const activities = weekActivities
    .filter((a) => a.kind === "ACTIVITY")
    .map((a) => ({
      title: a.title,
      note: a.note,
      date: isoDate(a.date),
    }));

  const submittedCount = student.submissions.filter(
    (s) => s.status !== "PENDING"
  ).length;
  const generalStudies = t.studiesLine(
    student.scores.length,
    bySubject.length,
    submittedCount,
    student.submissions.length
  );

  const achievements: string[] = [];
  const topSubject = bySubject[0];
  if (topSubject && topSubject.avg >= 70)
    achievements.push(t.aTop(topSubject.subject, Math.round(topSubject.avg)));
  const improving = [...bySubject].sort((a, b) => b.trend - a.trend)[0];
  if (improving && improving.trend > 4)
    achievements.push(t.aImproving(improving.subject));
  if (attPct >= 90 && weekAttendance.length)
    achievements.push(t.aAttendance(Math.round(attPct)));
  if (doneGoals > 0) achievements.push(t.aGoals(doneGoals));
  if (!achievements.length) achievements.push(t.aNone);

  const focusAreas: string[] = [];
  const weakestSubject = bySubject[bySubject.length - 1];
  if (weakestSubject && weakestSubject.avg < 75)
    focusAreas.push(
      t.fWeak(weakestSubject.subject, Math.round(weakestSubject.avg))
    );
  if (gaps.weak.length)
    focusAreas.push(
      t.fGaps(
        gaps.weak.length,
        gaps.weak
          .slice(0, 3)
          .map((g) => `${g.subject}: ${g.chapter}`)
          .join("; ")
      )
    );
  const declining = [...bySubject].sort((a, b) => a.trend - b.trend)[0];
  if (
    declining &&
    declining.trend < -5 &&
    declining.subject !== weakestSubject?.subject
  )
    focusAreas.push(t.fDecline(declining.subject));
  if (absents.length >= 2) focusAreas.push(t.cAbsent(absents.length));
  if (pending.length) focusAreas.push(t.cPending(pending.length));
  if (!focusAreas.length) focusAreas.push(t.focusOk);

  const generalAdvice = t.adviceLine(
    weakestSubject ? weakestSubject.subject : null,
    weakestSubject ? Math.round(weakestSubject.avg) : null
  );

  const subjectRows = bySubject.map((s) => {
    const weakChapters = gaps.weak
      .filter((g) => g.subject === s.subject)
      .slice(0, 3)
      .map((g) => g.chapter);
    const level =
      s.avg >= 78
        ? ("excellent" as const)
        : s.avg >= 62
          ? ("good" as const)
          : s.avg >= 45
            ? ("revise" as const)
            : ("urgent" as const);
    let rec = t.sRec(s.subject, Math.round(s.avg), level);
    if (s.trend > 4) rec += t.trendUp;
    else if (s.trend < -4) rec += t.trendDown;
    if (weakChapters.length) rec += t.sGaps(weakChapters.join(", "));
    const focusChapter = weakChapters[0] ?? null;
    return {
      subject: s.subject,
      avg: s.avg,
      count: s.count,
      trend: s.trend,
      weakChapters,
      rec,
      action: t.sAction(s.subject, focusChapter, level),
    };
  });

  const noteRows = [
    ...student.guidance.map((g) => ({
      id: g.id,
      kind: "Teacher" as const,
      author: g.author.name,
      category: g.category,
      title: g.title,
      excerpt:
        g.body.length > 150 ? `${g.body.slice(0, 150).trim()}…` : g.body,
      date: isoDate(g.createdAt),
    })),
    ...counseling.map((c) => ({
      id: c.id,
      kind: "Counselor" as const,
      author: c.counselor.name,
      category: "COUNSELING",
      title: "Guidance session",
      excerpt:
        (c.notes ?? "").length > 150
          ? `${(c.notes ?? "").slice(0, 150).trim()}…`
          : c.notes ?? "",
      date: isoDate(c.scheduledFor),
    })),
  ].slice(0, 4);

  const localeName = lang === "hi" ? "Hindi" : lang === "mr" ? "Marathi" : "English";
  let studies = generalStudies;
  let advice = generalAdvice;
  const aiGen = await callGeminiJSON<{ studies: string; advice: string }>(
    {
      prompt: `Parent weekly report data (JSON): ${JSON.stringify({
        child: student.user.name.split(" ")[0],
        overallPercent: Math.round(overall),
        weekAverage: weekAvg !== null ? Math.round(weekAvg) : null,
        changeVsLastWeek: delta !== null ? Math.round(delta) : null,
        attendancePercent: Math.round(attPct),
        highlights,
        concerns,
        focusAreas,
        subjects: subjectRows.map((s) => ({
          subject: s.subject,
          average: Math.round(s.avg),
          trend: Math.round(s.trend),
          focusChapters: s.weakChapters,
        })),
      })}

Return ONLY {"studies":"...","advice":"..."}.`,
      system:
        `You write the parent-facing part of Vidyora's weekly school report in ${localeName}. ` +
        `"studies": 2-3 warm, factual sentences summarising this week's learning. ` +
        `"advice": ONE specific doable action for the parent to do WITH the child THIS WEEK — 10-15 minutes, 2-3 times, naming a topic from the data, plus one encouraging question to ask (like "explain it your way"). ` +
        "Supportive and realistic; never alarming, never labelling the child. No markdown, plain text only.",
      json: true,
      temperature: 0.6,
      maxTokens: 500,
      timeoutMs: 5000,
      retries: 0,
      cacheKey: `rsum:${studentId}:${lang}`,
      cacheTtlMs: 30 * 60_000,
    },
    (v) => {
      const o = v as { studies?: unknown; advice?: unknown };
      const s =
        typeof o?.studies === "string"
          ? o.studies.replace(/\s+/g, " ").trim().slice(0, 600)
          : "";
      const a =
        typeof o?.advice === "string"
          ? o.advice.replace(/\s+/g, " ").trim().slice(0, 600)
          : "";
      return s.length >= 60 && a.length >= 60 ? { studies: s, advice: a } : null;
    }
  );
  if (aiGen) {
    studies = aiGen.studies;
    advice = aiGen.advice;
  }

  return {
    periodLabel: `${monday.toLocaleDateString(locale, { day: "numeric", month: "short" })} – ${new Date(weekEnd.getTime() - 864e5).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}`,
    attendance: { present, total: weekAttendance.length, pct: attPct, absents },
    assessments: scored,
    homework: homeworkDue.map((h) => ({
      title: h.homework.title,
      subject: h.homework.subject,
      due: isoDate(h.homework.dueDate),
      status: h.status,
    })),
    highlights: highlights.slice(0, 4),
    concerns: concerns.slice(0, 4),
    focusNext,
    overall,
    summary,
    delta,
    weekAvg,
    plans: plans.map((p) => ({ title: p.title, plan: p.plan ?? "" })),
    general: {
      studies,
      achievements,
      focus: focusAreas,
      advice,
    },
    subjects: subjectRows,
    notes: noteRows,
    behaviour,
    activities,
  };
}

export type TimelineEvent = {
  id: string;
  date: Date;
  kind: "TEST" | "QUIZ" | "HOMEWORK" | "REC" | "GUIDANCE" | "COUNSELING" | "ABSENT" | "GOAL";
  title: string;
  meta: string;
  tone: "success" | "danger" | "warning" | "brand" | "neutral";
};

export async function progressTimeline(studentId: string, take = 16) {
  const [scores, quizzes, subs, recs, guidance, sessions, goals, absents] =
    await Promise.all([
      db.score.findMany({
        where: { studentId },
        include: { assessment: { select: { title: true, subject: true, date: true, maxMarks: true } } },
        take: 12,
      }),
      db.quizAttempt.findMany({
        where: { studentId },
        include: { quiz: { select: { title: true, subject: true } } },
        take: 8,
      }),
      db.homeworkSubmission.findMany({
        where: { studentId, status: { in: ["SUBMITTED", "LATE", "ON_TIME"] } },
        include: { homework: { select: { title: true, subject: true, dueDate: true } } },
        take: 8,
      }),
      db.recommendation.findMany({
        where: { studentId },
        select: { id: true, title: true, kind: true, createdAt: true },
        take: 6,
      }),
      db.guidanceNote.findMany({
        where: { studentId },
        select: { id: true, title: true, category: true, createdAt: true },
        take: 5,
      }),
      db.counselingSession.findMany({
        where: { studentId },
        select: { id: true, scheduledFor: true, status: true },
        take: 5,
      }),
      db.studentGoal.findMany({
        where: { studentId, status: "DONE" },
        select: { id: true, title: true, updatedAt: true },
        take: 5,
      }),
      db.attendance.findMany({
        where: { studentId, status: "ABSENT" },
        select: { id: true, date: true },
        take: 6,
      }),
    ]);

  const events: TimelineEvent[] = [];

  for (const s of scores) {
    const p = pctOf(s.marks, s.assessment.maxMarks);
    events.push({
      id: "t" + s.id,
      date: s.assessment.date,
      kind: "TEST",
      title: `${s.assessment.subject} test � ${s.marks}/${s.assessment.maxMarks}`,
      meta: s.assessment.title,
      tone: p >= 75 ? "success" : p >= 50 ? "warning" : "danger",
    });
  }
  for (const a of quizzes) {
    const p = (a.score / a.total) * 100;
    events.push({
      id: "q" + a.id,
      date: a.createdAt,
      kind: "QUIZ",
      title: `Quiz � ${a.score}/${a.total}`,
      meta: `${a.quiz.subject} � ${a.quiz.title}`,
      tone: p >= 75 ? "success" : p >= 50 ? "warning" : "danger",
    });
  }
  for (const s of subs) {
    events.push({
      id: "h" + s.id,
      date: s.submittedOn ?? s.homework.dueDate,
      kind: "HOMEWORK",
      title: `Submitted � ${s.homework.title}`,
      meta: `${s.homework.subject} � ${s.status.toLowerCase()}`,
      tone: s.status === "LATE" ? "warning" : "success",
    });
  }
  for (const r of recs) {
    events.push({
      id: "r" + r.id,
      date: r.createdAt,
      kind: "REC",
      title: r.title,
      meta: "AI recommendation generated",
      tone: "brand",
    });
  }
  for (const g of guidance) {
    events.push({
      id: "g" + g.id,
      date: g.createdAt,
      kind: "GUIDANCE",
      title: g.title,
      meta: `Guidance � ${g.category}`,
      tone: "neutral",
    });
  }
  for (const s of sessions) {
    events.push({
      id: "c" + s.id,
      date: s.scheduledFor,
      kind: "COUNSELING",
      title: `Guidance session (${s.status.toLowerCase()})`,
      meta: "Scheduled with counselor",
      tone: "brand",
    });
  }
  for (const g of goals) {
    events.push({
      id: "o" + g.id,
      date: g.updatedAt,
      kind: "GOAL",
      title: `Goal completed � ${g.title}`,
      meta: "Self-set learning goal",
      tone: "success",
    });
  }
  for (const a of absents) {
    events.push({
      id: "a" + a.id,
      date: a.date,
      kind: "ABSENT",
      title: "Absent",
      meta: "Attendance record",
      tone: "danger",
    });
  }

  return events.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, take);
}

export type ClassInsights = {
  classId: string;
  className: string;
  section: string;
  studentCount: number;
  classAvg: number;
  attendanceAvg: number;
  subjectAvg: { subject: string; avg: number }[];
  hardestChapters: {
    subject: string;
    chapter: string;
    pct: number;
    attempts: number;
    students: number;
  }[];
  riskRows: { id: string; name: string; att: number; avg: number }[];
  movers: { id: string; name: string; delta: number }[];
  quizCount: number;
  aiBrief: { summary: string; actions: string[]; source: "ai" | "local" };
};

export async function classInsights(classId: string): Promise<ClassInsights | null> {
  const schoolClass = await db.schoolClass.findUnique({
    where: { id: classId },
    include: {
      students: {
        include: {
          user: { select: { name: true } },
          attendance: { select: { status: true } },
          scores: {
            include: {
              assessment: { select: { date: true, maxMarks: true, subject: true } },
            },
          },
        },
      },
      quizzes: { include: { attempts: true } },
    },
  });
  if (!schoolClass) return null;

  const students = schoolClass.students;
  const now = Date.now();
  const d30 = now - 30 * 864e5;

  const subjectMap = new Map<string, { marks: number; max: number }>();
  const riskRows: ClassInsights["riskRows"] = [];
  const movers: { id: string; name: string; delta: number }[] = [];
  let attSum = 0;
  let avgSum = 0;

  for (const st of students) {
    const m = st.scores.reduce((a, s) => a + s.marks, 0);
    const mx = st.scores.reduce((a, s) => a + s.assessment.maxMarks, 0);
    const avg = mx > 0 ? (m / mx) * 100 : 0;
    avgSum += avg;

    for (const s of st.scores) {
      const key = s.assessment.subject;
      const agg = subjectMap.get(key) ?? { marks: 0, max: 0 };
      agg.marks += s.marks;
      agg.max += s.assessment.maxMarks;
      subjectMap.set(key, agg);
    }

    const attPct = st.attendance.length
      ? (st.attendance.filter((a) => a.status !== "ABSENT").length / st.attendance.length) * 100
      : 100;
    attSum += attPct;
    if (attPct < 75 && avg > 0)
      riskRows.push({ id: st.id, name: st.user.name, att: Math.round(attPct), avg: Math.round(avg) });

    const recent = st.scores.filter((s) => s.assessment.date.getTime() >= d30);
    const older = st.scores.filter((s) => s.assessment.date.getTime() < d30);
    const wOf = (arr: typeof st.scores) => {
      const wm = arr.reduce((s, x) => s + x.marks, 0);
      const wmx = arr.reduce((s, x) => s + x.assessment.maxMarks, 0);
      return wmx > 0 ? (wm / wmx) * 100 : 0;
    };
    if (recent.length && older.length) {
      movers.push({
        id: st.id,
        name: st.user.name,
        delta: Math.round(wOf(recent) - wOf(older)),
      });
    }
  }

  const chapterMap = new Map<
    string,
    {
      subject: string;
      chapter: string;
      correct: number;
      total: number;
      students: Set<string>;
    }
  >();
  let quizCount = 0;
  for (const quiz of schoolClass.quizzes) {
    for (const attempt of quiz.attempts) {
      quizCount++;
      let questions: { chapter?: string }[] = [];
      let detail: { correct?: boolean }[] = [];
      try {
        questions = JSON.parse(quiz.questions);
        detail = JSON.parse(attempt.detail);
      } catch {
        continue;
      }
      questions.forEach((q, i) => {
        const chapter = q.chapter || "General";
        const key = `${quiz.subject}::${chapter}`;
        let agg = chapterMap.get(key);
        if (!agg) {
          agg = {
            subject: quiz.subject,
            chapter,
            correct: 0,
            total: 0,
            students: new Set<string>(),
          };
          chapterMap.set(key, agg);
        }
        agg.total += 1;
        agg.students.add(attempt.studentId);
        if (detail[i]?.correct) agg.correct += 1;
        chapterMap.set(key, agg);
      });
    }
  }

  const hardestChapters = [...chapterMap.values()]
    .filter((c) => c.total >= 2)
    .map((c) => ({
      subject: c.subject,
      chapter: c.chapter,
      pct: Math.round((c.correct / c.total) * 100),
      attempts: c.total,
      students: c.students.size,
    }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 8);

  const subjectAvg = [...subjectMap.entries()]
    .map(([subject, a]) => ({
      subject,
      avg: a.max > 0 ? Math.round((a.marks / a.max) * 100) : 0,
    }))
    .sort((a, b) => a.avg - b.avg);

  const classAvg = students.length ? Math.round(avgSum / students.length) : 0;
  const attendanceAvg = students.length ? Math.round(attSum / students.length) : 0;
  const focusSubject = subjectAvg[0];
  const hardest = hardestChapters[0];
  const localBrief = {
    summary: [
      `${schoolClass.name} averages ${classAvg}% across ${students.length} students.`,
      focusSubject
        ? `${focusSubject.subject} needs the most support right now (${focusSubject.avg}% class average).`
        : "",
      hardest
        ? `${hardest.chapter} (${hardest.subject}) is the weakest topic — ${hardest.pct}% correct over ${hardest.attempts} responses.`
        : "",
      attendanceAvg < 80 ? `Attendance at ${attendanceAvg}% is holding some learners back.` : "",
    ]
      .filter(Boolean)
      .join(" "),
    actions: [
      hardest
        ? `Spend one lesson re-teaching ${hardest.chapter} before moving ahead.`
        : "Keep the current revision cycle going.",
      riskRows.length
        ? `Check in supportively with ${riskRows
            .slice(0, 2)
            .map((r) => r.name.split(" ")[0])
            .join(" and ")} — evidence-led, not punitive.`
        : "No attendance-driven check-ins needed right now.",
      focusSubject
        ? `Run a short follow-up quiz on ${focusSubject.subject} next week to measure the gap.`
        : "Consider a challenge quiz to stretch the class.",
    ].slice(0, 3),
  };

  const aiResult = await callGeminiJSON<{ summary: string; actions: string[] }>(
    {
      prompt: `Class analytics (JSON): ${JSON.stringify({
        className: `${schoolClass.name} (${schoolClass.section})`,
        students: students.length,
        classAveragePercent: classAvg,
        attendancePercent: attendanceAvg,
        subjectAverages: subjectAvg.slice(0, 6),
        weakestTopics: hardestChapters.slice(0, 5),
        needsCheckIn: riskRows.slice(0, 3).map((r) => ({
          first: r.name.split(" ")[0],
          attendance: r.att,
          average: r.avg,
        })),
        improving: movers.slice(0, 3).map((m) => ({
          first: m.name.split(" ")[0],
          change: m.delta,
        })),
      })}

Return ONLY {"summary":"...","actions":["..."]}.`,
      system:
        "You are Vidyora's teaching coach writing a brief for a class teacher. " +
        "Summary: 2-3 supportive, data-grounded sentences (under 320 chars) on how the class is doing and where to focus. " +
        "Actions: 2-4 concrete next steps for the TEACHER this week (re-teach a topic, check in with a student, plan a follow-up quiz). " +
        "Evidence-led and encouraging — never label students or the class negatively. Plain English, no markdown.",
      json: true,
      temperature: 0.5,
      maxTokens: 600,
      timeoutMs: 5000,
      retries: 0,
      cacheKey: `cbrief:${classId}`,
      cacheTtlMs: 20 * 60_000,
    },
    (v) => {
      const o = v as { summary?: unknown; actions?: unknown };
      const summary =
        typeof o?.summary === "string"
          ? o.summary.replace(/\s+/g, " ").trim().slice(0, 400)
          : "";
      let actions: string[] = [];
      if (Array.isArray(o?.actions)) {
        actions = o.actions
          .map((x) =>
            typeof x === "string" ? x.replace(/\s+/g, " ").trim().slice(0, 240) : ""
          )
          .filter(Boolean)
          .slice(0, 5);
      }
      return summary.length >= 60 && actions.length >= 2
        ? { summary, actions }
        : null;
    }
  );

  const aiBrief = aiResult
    ? { ...aiResult, source: "ai" as const }
    : { ...localBrief, source: "local" as const };

  return {
    classId,
    className: schoolClass.name,
    section: schoolClass.section,
    studentCount: students.length,
    classAvg,
    attendanceAvg,
    subjectAvg,
    hardestChapters,
    riskRows: riskRows.sort((a, b) => a.att - b.att).slice(0, 6),
    movers: movers
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 6),
    quizCount,
    aiBrief,
  };
}
