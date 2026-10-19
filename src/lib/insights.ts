import { db } from "@/lib/db";
import { isoDate } from "@/lib/utils";
import { REPORT_COPY, localeOf, type Lang } from "@/lib/report-i18n";

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
  const stats: SubjectStat[] = [];
  for (const [subject, arr] of bySubject) {
    const sorted = [...arr].sort((a, b) => a.date.getTime() - b.date.getTime());
    const total = sorted.reduce((s, r) => s + r.pct, 0);
    const avg = total / sorted.length;
    const half = Math.floor(sorted.length / 2);
    let trend = 0;
    if (sorted.length >= 4) {
      const earlier =
        sorted.slice(0, half).reduce((s, r) => s + r.pct, 0) / (half || 1);
      const recent =
        sorted.slice(sorted.length - half).reduce((s, r) => s + r.pct, 0) / (half || 1);
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

  const totalMarks = student.scores.reduce(
    (s, x) => s + pctOf(x.marks, x.assessment.maxMarks),
    0
  );
  const overall = rows.length ? totalMarks / rows.length : 0;

  const recent = rows.slice(-4);
  const earlier = rows.slice(0, Math.max(rows.length - 4, 0));
  const recentAvg = recent.length
    ? recent.reduce((s, r) => s + r.pct, 0) / recent.length
    : overall;
  const earlierAvg = earlier.length
    ? earlier.reduce((s, r) => s + r.pct, 0) / earlier.length
    : overall;
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
    .map((c) => ({
      id: c.id,
      avg: c.scores.length
        ? c.scores.reduce((s, x) => s + pctOf(x.marks, x.assessment.maxMarks), 0) /
          c.scores.length
        : 0,
    }))
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
  const agg = await db.score.aggregate({
    where: { student: { classId }, assessment: { classId } },
    _avg: { marks: true },
  });
  const max = await db.assessment.findFirst({
    where: { classId },
    orderBy: { date: "desc" },
    select: { maxMarks: true },
  });
  if (!agg._avg.marks || !max) return 0;
  return pctOf(agg._avg.marks, max.maxMarks);
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

  const overall = scores.length
    ? scores.reduce((s, x) => s + pctOf(x.marks, x.assessment.maxMarks), 0) /
      scores.length
    : 0;

  const present = attendance.filter((a) => a.status !== "ABSENT").length;
  const attendancePct = attendance.length
    ? (present / attendance.length) * 100
    : 100;

  const bySubject = new Map<string, { sum: number; n: number; trend: number[] }>();
  for (const s of scores) {
    const k = s.assessment.subject;
    const e = bySubject.get(k) ?? { sum: 0, n: 0, trend: [] };
    e.sum += pctOf(s.marks, s.assessment.maxMarks);
    e.n += 1;
    e.trend.push(pctOf(s.marks, s.assessment.maxMarks));
    bySubject.set(k, e);
  }
  const subjects = [...bySubject.entries()]
    .map(([subject, e]) => ({ subject, avg: e.sum / e.n, count: e.n }))
    .sort((a, b) => b.avg - a.avg);

  const byClass = new Map<string, { sum: number; n: number; name: string }>();
  for (const s of scores) {
    const k = s.student.classId;
    const e = byClass.get(k) ?? { sum: 0, n: 0, name: `${s.student.schoolClass.name} ${s.student.schoolClass.section}` };
    e.sum += pctOf(s.marks, s.assessment.maxMarks);
    e.n += 1;
    byClass.set(k, e);
  }
  const classAvgs = [...byClass.values()]
    .map((e) => ({ name: e.name, avg: e.sum / e.n }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const byMonth = new Map<string, { sum: number; n: number }>();
  for (const s of assessments) {
    const key = isoDate(s.date).slice(0, 7);
    const rows = scores.filter((x) => x.assessmentId === s.id);
    const e = byMonth.get(key) ?? { sum: 0, n: 0 };
    for (const r of rows) {
      e.sum += pctOf(r.marks, s.maxMarks);
      e.n += 1;
    }
    if (e.n) byMonth.set(key, e);
  }
  const monthly = [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, e]) => ({ month, value: Math.round(e.sum / e.n) }));

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
      const avg = st.scores.length
        ? st.scores.reduce((s, x) => s + pctOf(x.marks, x.assessment.maxMarks), 0) /
          st.scores.length
        : 0;
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

  const overall = scores.length
    ? scores.reduce((s, x) => s + pctOf(x.marks, x.assessment.maxMarks), 0) /
      scores.length
    : 0;

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

  const subjectMap = new Map<string, { sum: number; n: number }>();
  for (const s of scores) {
    const k = s.assessment.subject;
    const e = subjectMap.get(k) ?? { sum: 0, n: 0 };
    e.sum += pctOf(s.marks, s.assessment.maxMarks);
    e.n += 1;
    subjectMap.set(k, e);
  }
  const subjects = [...subjectMap.entries()]
    .map(([subject, e]) => ({ subject, avg: e.sum / e.n, count: e.n }))
    .sort((a, b) => b.avg - a.avg);

  const monthMap = new Map<string, { sum: number; n: number }>();
  for (const s of scores) {
    const key = isoDate(s.assessment.date).slice(0, 7);
    const e = monthMap.get(key) ?? { sum: 0, n: 0 };
    e.sum += pctOf(s.marks, s.assessment.maxMarks);
    e.n += 1;
    monthMap.set(key, e);
  }
  const trend = [...monthMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, e]) => ({ month, value: Math.round(e.sum / e.n) }));

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
      const avg = st.scores.length
        ? st.scores.reduce((s, x) => s + pctOf(x.marks, x.assessment.maxMarks), 0) /
          st.scores.length
        : 0;
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

  const allPcts = student.scores.map((s) =>
    pctOf(s.marks, s.assessment.maxMarks)
  );
  const overall = allPcts.length
    ? allPcts.reduce((s, v) => s + v, 0) / allPcts.length
    : 0;

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

  const weekPcts = weekAssessments.map((s) => pctOf(s.marks, s.assessment.maxMarks));
  const prevPcts = prevScores.map((s) => pctOf(s.marks, s.assessment.maxMarks));
  const weekAvg = weekPcts.length
    ? weekPcts.reduce((s, v) => s + v, 0) / weekPcts.length
    : null;
  const prevAvg = prevPcts.length
    ? prevPcts.reduce((s, v) => s + v, 0) / prevPcts.length
    : null;
  const delta = weekAvg !== null && prevAvg !== null ? weekAvg - prevAvg : null;

  const plans = await db.recommendation.findMany({
    where: { studentId, planStatus: "APPROVED", plan: { not: null } },
    select: { title: true, plan: true },
    orderBy: { updatedAt: "desc" },
    take: 4,
  });

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
      title: `Counseling session (${s.status.toLowerCase()})`,
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
  hardestChapters: { subject: string; chapter: string; pct: number; attempts: number }[];
  riskRows: { id: string; name: string; att: number; avg: number }[];
  movers: { id: string; name: string; delta: number }[];
  quizCount: number;
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

  const subjectMap = new Map<string, { sum: number; n: number }>();
  const riskRows: ClassInsights["riskRows"] = [];
  const movers: { id: string; name: string; delta: number }[] = [];
  let attSum = 0;
  let avgSum = 0;

  for (const st of students) {
    const pcts = st.scores.map((s) => pctOf(s.marks, s.assessment.maxMarks));
    const avg = pcts.length ? pcts.reduce((a, b) => a + b, 0) / pcts.length : 0;
    avgSum += avg;

    for (const s of st.scores) {
      const key = s.assessment.subject;
      const agg = subjectMap.get(key) ?? { sum: 0, n: 0 };
      agg.sum += pctOf(s.marks, s.assessment.maxMarks);
      agg.n += 1;
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
    if (recent.length && older.length) {
      const rAvg = recent.reduce((s, x) => s + pctOf(x.marks, x.assessment.maxMarks), 0) / recent.length;
      const oAvg = older.reduce((s, x) => s + pctOf(x.marks, x.assessment.maxMarks), 0) / older.length;
      movers.push({ id: st.id, name: st.user.name, delta: Math.round(rAvg - oAvg) });
    }
  }

  const chapterMap = new Map<string, { subject: string; chapter: string; correct: number; total: number }>();
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
        const agg =
          chapterMap.get(key) ?? { subject: quiz.subject, chapter, correct: 0, total: 0 };
        agg.total += 1;
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
    }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 8);

  const subjectAvg = [...subjectMap.entries()]
    .map(([subject, a]) => ({ subject, avg: Math.round(a.sum / a.n) }))
    .sort((a, b) => a.avg - b.avg);

  return {
    classId,
    className: schoolClass.name,
    section: schoolClass.section,
    studentCount: students.length,
    classAvg: students.length ? Math.round(avgSum / students.length) : 0,
    attendanceAvg: students.length ? Math.round(attSum / students.length) : 0,
    subjectAvg,
    hardestChapters,
    riskRows: riskRows.sort((a, b) => a.att - b.att).slice(0, 6),
    movers: movers
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 6),
    quizCount,
  };
}
