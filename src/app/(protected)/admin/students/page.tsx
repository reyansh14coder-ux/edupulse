import Link from "next/link";
import { Search, Users } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn, pct } from "@/lib/utils";
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  PageHeader,
  btnPrimary,
  inputCls,
} from "@/components/ui";

export const metadata = { title: "Students" };

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; class?: string }>;
}) {
  await requireSession(["ADMIN"]);
  const { q = "", class: classFilter = "" } = await searchParams;

  const [classes, students] = await Promise.all([
    db.schoolClass.findMany({ orderBy: { name: "asc" } }),
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
  ]);

  const rows = students
    .map((s) => {
      const avg = s.scores.length
        ? s.scores.reduce((a, x) => a + (x.marks / x.assessment.maxMarks) * 100, 0) /
          s.scores.length
        : 0;
      const att = s.attendance.length
        ? (s.attendance.filter((a) => a.status !== "ABSENT").length /
            s.attendance.length) *
          100
        : 100;
      return {
        id: s.id,
        name: s.user.name,
        email: s.user.email,
        className: `${s.schoolClass.name} ${s.schoolClass.section}`,
        classId: s.classId,
        roll: s.rollNo,
        admissionNo: s.admissionNo,
        avg,
        att,
        parents: s.parentLinks.map((p) => p.parent.name),
      };
    })
    .filter((r) => {
      const term = q.trim().toLowerCase();
      const matchQ =
        !term ||
        r.name.toLowerCase().includes(term) ||
        r.admissionNo.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term);
      const matchC = !classFilter || r.classId === classFilter;
      return matchQ && matchC;
    });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Students"
        sub={`${rows.length} of ${students.length} students shown`}
      />

      <Card className="mb-5 p-4">
        <form
          method="get"
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by name, admission no. or email…"
              className={cn(inputCls, "pl-10")}
            />
          </div>
          <select
            name="class"
            defaultValue={classFilter}
            className={cn(inputCls, "sm:w-56")}
          >
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.section}
              </option>
            ))}
          </select>
          <button type="submit" className={btnPrimary}>
            Apply filters
          </button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            title="No students match your filters"
            hint="Try a different name or clear the class filter."
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
                      <Link
                        href={`/students/${r.id}`}
                        className="flex items-center gap-3"
                      >
                        <Avatar name={r.name} size="sm" />
                        <span>
                          <span className="block font-bold text-ink-900 hover:text-brand-700">
                            {r.name}
                          </span>
                          <span className="block text-[12px] text-ink-400">
                            {r.admissionNo}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-ink-700">{r.className}</td>
                    <td className="px-4 py-3.5 text-ink-600">{r.roll}</td>
                    <td className="px-4 py-3.5 font-bold text-ink-900">{pct(r.avg)}</td>
                    <td className="px-4 py-3.5 font-bold text-ink-900">{pct(r.att)}</td>
                    <td className="px-4 py-3.5 text-ink-600">
                      {r.parents.join(", ") || "—"}
                    </td>
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
    </div>
  );
}
