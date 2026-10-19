import { BookMarked, GraduationCap, Layers, UserPlus } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { SUBJECTS, SYLLABUS } from "@/lib/question-bank";
import { cn } from "@/lib/utils";
import {
  Badge,
  Card,
  CardHeader,
  PageHeader,
  btnPrimary,
  inputCls,
  labelCls,
} from "@/components/ui";
import {
  addChapterAction,
  addClassAction,
  assignTeacherAction,
  createStudentAction,
  createTeacherAction,
} from "@/app/actions/admin";

export const metadata = { title: "Academic setup" };

export default async function AdminSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ cls?: string; subj?: string }>;
}) {
  await requireSession(["ADMIN"]);
  const { cls = "", subj = "" } = await searchParams;

  const [classes, teachers, studentCount, chapters] = await Promise.all([
    db.schoolClass.findMany({
      include: { _count: { select: { students: true, assignments: true } } },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: { role: "TEACHER" },
      select: { id: true, name: true, title: true },
      orderBy: { name: "asc" },
    }),
    db.student.count(),
    cls && subj
      ? db.chapter.findMany({
          where: { classId: cls, subject: subj },
          orderBy: { order: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const selectedClass = classes.find((c) => c.id === cls);
  const subject = subj || SUBJECTS[0];
  const fallbackChapters = SYLLABUS[subject] ?? [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Academic setup"
        sub="Board, classes, subjects, syllabus, teachers and students — the foundation of the Vidyora record."
        action={<Badge tone="brand">Board: CBSE · Year 2026-27</Badge>}
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Classes"
            sub={`${classes.length} classes · ${studentCount} students enrolled`}
          />
          <div className="overflow-x-auto px-2 pb-2 pt-3">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-ink-400">
                  <th className="px-4 py-2 font-bold">Class</th>
                  <th className="px-4 py-2 font-bold">Board</th>
                  <th className="px-4 py-2 font-bold">Year</th>
                  <th className="px-4 py-2 font-bold">Students</th>
                  <th className="px-4 py-2 font-bold">Subjects assigned</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((c) => (
                  <tr key={c.id} className="border-t border-line">
                    <td className="px-4 py-3 font-bold text-ink-900">
                      {c.name} {c.section}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="info">{c.board}</Badge>
                    </td>
                    <td className="px-4 py-3 text-ink-600">{c.year}</td>
                    <td className="px-4 py-3 text-ink-700">{c._count.students}</td>
                    <td className="px-4 py-3 text-ink-700">{c._count.assignments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Add class" sub="Creates class, seeds CBSE syllabus chapters automatically" />
          <form action={addClassAction} className="grid gap-3.5 p-5 pt-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="c-name">Class name *</label>
              <input id="c-name" name="name" required placeholder="Class 11" className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="c-section">Section</label>
              <input id="c-section" name="section" defaultValue="A" className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="c-year">Academic year</label>
              <input id="c-year" name="year" defaultValue="2026-27" className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="c-board">Education board</label>
              <select id="c-board" name="board" className={inputCls}>
                <option>CBSE</option>
                <option>ICSE</option>
                <option>State Board</option>
                <option>IB</option>
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="c-teacher">Assign subject teacher (optional)</label>
              <select id="c-teacher" name="teacherId" className={inputCls} defaultValue="">
                <option value="">— none —</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="c-subject">Subject (for the teacher above)</label>
              <select id="c-subject" name="subject" className={inputCls} defaultValue="">
                <option value="">—</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className={cn(btnPrimary, "w-full sm:w-auto")}>
                <Layers size={16} /> Create class + syllabus
              </button>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader title="Add teacher" sub="New staff account (password: demo123)" />
          <form action={createTeacherAction} className="grid gap-3.5 p-5 pt-4 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="t-name">Full name *</label>
              <input id="t-name" name="name" required placeholder="Ramesh Deshpande" className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="t-email">Email *</label>
              <input id="t-email" name="email" type="email" required placeholder="name@vidyaniketan.edu.in" className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="t-subject">Primary subject</label>
              <select id="t-subject" name="subject" className={inputCls}>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="t-title">Designation</label>
              <input id="t-title" name="title" placeholder="TGT Science" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className={cn(btnPrimary, "w-full sm:w-auto")}>
                <UserPlus size={16} /> Add teacher
              </button>
            </div>
          </form>

          <div className="border-t border-line p-5">
            <p className="mb-3 text-[12.5px] font-bold text-ink-600">Assign teacher to class & subject</p>
            <form action={assignTeacherAction} className="grid gap-3 sm:grid-cols-4">
              <select name="teacherId" required className={inputCls} defaultValue="">
                <option value="">Teacher…</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <select name="classId" required className={inputCls} defaultValue="">
                <option value="">Class…</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                ))}
              </select>
              <select name="subject" required className={inputCls} defaultValue="">
                <option value="">Subject…</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button type="submit" className={btnPrimary}>Assign</button>
            </form>
          </div>
        </Card>

        <Card>
          <CardHeader title="Add student" sub="Creates student + parent access (password: demo123)" />
          <form action={createStudentAction} className="grid gap-3.5 p-5 pt-4 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="s-name">Student name *</label>
              <input id="s-name" name="name" required placeholder="Ishita Verma" className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="s-class">Class *</label>
              <select id="s-class" name="classId" required className={inputCls} defaultValue="">
                <option value="">Select class…</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="s-roll">Roll number</label>
              <input id="s-roll" name="rollNo" type="number" min={1} placeholder="auto" className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="s-email">Student email (optional)</label>
              <input id="s-email" name="email" type="email" placeholder="auto-generated" className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="s-parent">Parent name (optional)</label>
              <input id="s-parent" name="parentName" placeholder="Sushma Verma" className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="s-pemail">Parent email (optional)</label>
              <input id="s-pemail" name="parentEmail" type="email" placeholder="auto-generated" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className={cn(btnPrimary, "w-full sm:w-auto")}>
                <GraduationCap size={16} /> Enroll student
              </button>
            </div>
          </form>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader
            title="Syllabus / curriculum"
            sub="Chapters power AI recommendations and quiz generation context"
            action={<Badge tone="brand"><BookMarked size={12} /> {chapters.length || fallbackChapters.length} chapters</Badge>}
          />
          <div className="p-5 pt-4">
            <form method="get" className="mb-4 flex flex-wrap gap-3">
              <select name="cls" defaultValue={cls} className={cn(inputCls, "w-52")}>
                <option value="">Select class…</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                ))}
              </select>
              <select name="subj" defaultValue={subject} className={cn(inputCls, "w-52")}>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button type="submit" className={btnPrimary}>View syllabus</button>
            </form>

            {cls ? (
              <div className="space-y-4">
                <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {(chapters.length ? chapters : []).map((c, i) => (
                    <li
                      key={c.id}
                      className="flex items-center gap-3 rounded-xl border border-line bg-surface/60 px-3.5 py-2.5 text-[13.5px] font-semibold text-ink-700"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 text-[11px] font-extrabold text-brand-700">
                        {i + 1}
                      </span>
                      {c.title}
                    </li>
                  ))}
                  {!chapters.length && (
                    <li className="text-[13px] text-ink-500">
                      No chapters yet — add the first one below.
                    </li>
                  )}
                </ol>
                <form
                  action={addChapterAction}
                  className="flex flex-wrap items-end gap-3 rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 p-4"
                >
                  <input type="hidden" name="classId" value={cls} />
                  <input type="hidden" name="subject" value={subject} />
                  <div className="min-w-[240px] flex-1">
                    <label className={labelCls} htmlFor="ch-title">New chapter title</label>
                    <input
                      id="ch-title"
                      name="title"
                      required
                      placeholder={`e.g. ${fallbackChapters[0] ?? "Chapter name"}`}
                      className={inputCls}
                    />
                  </div>
                  <button type="submit" className={btnPrimary}>Add chapter</button>
                </form>
              </div>
            ) : (
              <p className="rounded-xl bg-surface px-4 py-6 text-center text-[13.5px] text-ink-500">
                Select a class above to view and edit its syllabus.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
