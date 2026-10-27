import Link from "next/link";
import { GraduationCap, MessageSquareWarning, Percent, Search, Users } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { gradeTree } from "@/lib/admin";
import { cn, pct } from "@/lib/utils";
import { setStudentFeedbackStatusAction } from "@/app/actions/feedback";
import {
  Avatar,
  Badge,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  StatCard,
  btnPrimary,
  inputCls,
} from "@/components/ui";

export const metadata = { title: "Students" };

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; grade?: string; section?: string }>;
}) {
  await requireSession(["ADMIN"]);
  const sp = await searchParams;
  const q = sp.q ?? "";
  const gradeFilter = sp.grade ?? "";
  const sectionFilter = sp.section ?? "";

  const [classes, students, grades, feedback] = await Promise.all([
    db.schoolClass.findMany({ orderBy: [{ name: "asc" }, { section: "asc" }] }),
    db.student.findMany({
      include: {
        user: true,
        schoolClass: true,
        scores: { include: { assessment: true } },
        attendance: true,
        parentLinks: { include: { parent: true } },
      },
      orderBy: [{ classId: "asc" }, { rollNo: "asc" }],
    }),
    gradeTree(),
    db.studentFeedback.findMany({
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            schoolClass: { select: { name: true, section: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const allRows = students.map((s) => {
    const m = s.scores.reduce((a, x) => a + x.marks, 0);
    const mx = s.scores.reduce((a, x) => a + x.assessment.maxMarks, 0);
    const avg = mx > 0 ? (m / mx) * 100 : 0;
    const att = s.attendance.length
      ? (s.attendance.filter((a) => a.status !== "ABSENT").length / s.attendance.length) * 100
      : 100;
    return {
      id: s.id,
      name: s.user.name,
      email: s.user.email,
      className: `${s.schoolClass.name} ${s.schoolClass.section}`,
      grade: s.schoolClass.name,
      section: s.schoolClass.section,
      classId: s.classId,
      roll: s.rollNo,
      admissionNo: s.admissionNo,
      avg,
      att,
      marks: m,
      max: mx,
      parents: s.parentLinks.map((p) => p.parent.name),
    };
  });

  const totalStudents = allRows.length;
  const schoolMarks = allRows.reduce((a, r) => a + r.marks, 0);
  const schoolMax = allRows.reduce((a, r) => a + r.max, 0);
  const schoolAvg = schoolMax > 0 ? (schoolMarks / schoolMax) * 100 : 0;

  const activeGrade = grades.find((g) => g.name === gradeFilter) ?? null;
  const sectionsForGrade = activeGrade
    ? classes.filter((c) => c.name === activeGrade.name)
    : [];

  const rows = allRows.filter((r) => {
    const term = q.trim().toLowerCase();
    const matchQ =
      !term ||
      r.name.toLowerCase().includes(term) ||
      r.admissionNo.toLowerCase().includes(term) ||
      r.email.toLowerCase().includes(term);
    const matchG = !gradeFilter || r.grade === gradeFilter;
    const matchS = !sectionFilter || r.section === sectionFilter;
    return matchQ && matchG && matchS;
  });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Students" sub={`${rows.length} of ${totalStudents} students shown`} />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total students"
          value={totalStudents}
          hint="Entire school"
          icon={<GraduationCap size={18} />}
          tone="brand"
        />
        <StatCard
          label="School average"
          value={pct(schoolAvg)}
          hint="Overall % of all students"
          icon={<Percent size={18} />}
          tone={schoolAvg >= 60 ? "success" : "warning"}
        />
        <StatCard
          label="Grades"
          value={grades.length}
          hint={grades.map((g) => g.name.replace("Class ", "C")).join(", ") || "—"}
          icon={<Users size={18} />}
          tone="info"
        />
        <StatCard
          label="Classes"
          value={classes.length}
          hint="Grade × section sections"
          icon={<Users size={18} />}
          tone="neutral"
        />
      </div>

      <Card className="mb-5 p-4">
        <form method="get" className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by name, admission no. or email…"
              className={cn(inputCls, "pl-10")}
            />
          </div>
          <select
            name="grade"
            defaultValue={gradeFilter}
            className={cn(inputCls, "lg:w-44")}
          >
            <option value="">All grades</option>
            {grades.map((g) => (
              <option key={g.name} value={g.name}>{g.name}</option>
            ))}
          </select>
          <select name="section" defaultValue={sectionFilter} className={cn(inputCls, "lg:w-40")}>
            <option value="">All sections</option>
            {sectionsForGrade.map((c) => (
              <option key={c.id} value={c.section}>Section {c.section}</option>
            ))}
          </select>
          <button type="submit" className={btnPrimary}>Apply filters</button>
        </form>
        {activeGrade && (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
            <Link
              href={`/admin/students${q ? `?q=${encodeURIComponent(q)}` : ""}`}
              className={cn(
                "rounded-full px-3 py-1 text-[12px] font-bold transition",
                !sectionFilter ? "bg-ink-900 text-white" : "bg-surface text-ink-600 ring-1 ring-line"
              )}
            >
              All sections
            </Link>
            {sectionsForGrade.map((c) => (
              <Link
                key={c.id}
                href={`/admin/students?grade=${encodeURIComponent(activeGrade.name)}&section=${encodeURIComponent(c.section)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className={cn(
                  "rounded-full px-3 py-1 text-[12px] font-bold transition",
                  c.section === sectionFilter
                    ? "bg-ink-900 text-white"
                    : "bg-surface text-ink-600 ring-1 ring-line hover:ring-brand-300"
                )}
              >
                Section {c.section}
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            title="No students match your filters"
            hint="Try a different name or clear the grade/section filter."
            icon={<Users size={20} />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-surface/70">
                <tr className="text-[11px] uppercase tracking-wider text-ink-400">
                  <th className="px-5 py-3 font-bold">Student</th>
                  <th className="px-4 py-3 font-bold">Class</th>
                  <th className="px-4 py-3 font-bold">Roll</th>
                  <th className="px-4 py-3 font-bold">Average</th>
                  <th className="px-4 py-3 font-bold">Attendance</th>
                  <th className="px-4 py-3 font-bold">Parent</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-line transition hover:bg-surface/60">
                    <td className="px-5 py-3.5">
                      <Link href={`/students/${r.id}`} className="flex items-center gap-3">
                        <Avatar name={r.name} size="sm" />
                        <span>
                          <span className="block font-bold text-ink-900 hover:text-brand-700">{r.name}</span>
                          <span className="block text-[12px] text-ink-400">{r.admissionNo}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-ink-700">{r.className}</td>
                    <td className="px-4 py-3.5 text-ink-600">{r.roll}</td>
                    <td className="px-4 py-3.5 font-bold text-ink-900">{pct(r.avg)}</td>
                    <td className="px-4 py-3.5 font-bold text-ink-900">{pct(r.att)}</td>
                    <td className="px-4 py-3.5 text-ink-600">{r.parents.join(", ") || "—"}</td>
                    <td className="px-4 py-3.5">
                      {r.avg >= 75 && r.att >= 85 ? (
                        <Badge tone="success">On track</Badge>
                      ) : r.avg < 50 || r.att < 75 ? (
                        <Badge tone="danger">Needs attention</Badge>
                      ) : (
                        <Badge tone="warning">Watch</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="mt-5">
        <CardHeader
          title="Feedback & complaints from students"
          sub="Suggestions, praise and complaints submitted by students reach the principal here."
        />
        <ul className="divide-y divide-line px-5 pb-5 pt-2">
          {feedback.map((f) => (
            <li key={f.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
              <div className="flex min-w-0 items-start gap-3">
                <Avatar name={f.student.user.name} size="sm" />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-bold text-ink-900">
                    {f.category === "COMPLAINT" ? "Complaint" : f.category === "PRAISE" ? "Praise" : "Suggestion"}
                    <span className="font-semibold text-ink-500">· {f.student.user.name}</span>
                    <span className="text-[12px] font-semibold text-ink-400">
                      {f.student.schoolClass.name} {f.student.schoolClass.section}
                    </span>
                    <Badge tone="neutral">{f.subject}</Badge>
                  </p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-ink-600">{f.body}</p>
                  <p className="mt-0.5 text-[11.5px] text-ink-400">
                    {f.createdAt.toLocaleDateString("en-IN", { dateStyle: "medium" })}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge tone={f.status === "RESOLVED" ? "success" : f.status === "REVIEWED" ? "info" : "danger"}>
                  {f.status.toLowerCase()}
                </Badge>
                {f.status === "NEW" && (
                  <MarkFbBtn id={f.id} status="REVIEWED" label="Review" />
                )}
                {f.status !== "RESOLVED" && (
                  <MarkFbBtn id={f.id} status="RESOLVED" label="Resolve" />
                )}
              </div>
            </li>
          ))}
          {!feedback.length && (
            <li className="flex flex-col items-center gap-2 py-8 text-center text-[13px] text-ink-500">
              <MessageSquareWarning size={20} className="text-ink-300" />
              No student feedback yet — entries submitted from student dashboards appear here.
            </li>
          )}
        </ul>
      </Card>
    </div>
  );
}

function MarkFbBtn({ id, status, label }: { id: string; status: string; label: string }) {
  return (
    <form action={setStudentFeedbackStatusAction.bind(null, id, status)}>
      <button
        type="submit"
        className="rounded-lg border border-line bg-card px-2.5 py-1 text-[11.5px] font-bold text-ink-600 transition hover:border-brand-300 hover:text-brand-700"
      >
        {label}
      </button>
    </form>
  );
}
