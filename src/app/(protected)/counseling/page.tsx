import Link from "next/link";
import {
  CalendarPlus,
  HeartHandshake,
  NotebookPen,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { pct } from "@/lib/utils";
import {
  createGuidanceNoteAction,
  scheduleSessionAction,
  updateSessionStatusAction,
} from "@/app/actions/guidance";
import { refreshRecommendationsAction } from "@/app/actions/recommend";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  Field,
  inputCls,
  labelCls,
} from "@/components/ui";

export const metadata = { title: "Counseling" };

export default async function CounselingPage() {
  const session = await requireSession(["ADMIN", "TEACHER"]);
  const [students, sessions, notes, recommendations] = await Promise.all([
    db.student.findMany({
      include: {
        user: { select: { name: true } },
        schoolClass: { select: { name: true, section: true } },
      },
      orderBy: { rollNo: "asc" },
    }),
    db.counselingSession.findMany({
      include: {
        student: {
          include: { user: { select: { name: true } }, schoolClass: true },
        },
        counselor: { select: { name: true } },
      },
      orderBy: { scheduledFor: "desc" },
      take: 30,
    }),
    db.guidanceNote.findMany({
      include: {
        student: { include: { user: { select: { name: true } }, schoolClass: true } },
        author: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.recommendation.findMany({
      where: { status: "NEW" },
      include: { student: { include: { user: { select: { name: true } }, schoolClass: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const teacherScope =
    session.role === "TEACHER"
      ? (await db.teacherAssignment.findMany({ where: { teacherId: session.sub } })).map(
          (a) => a.classId,
        )
      : null;

  const visibleRecs = recommendations.filter(
    (r) => !teacherScope || r.student && teacherScope.includes(r.student.classId ?? ""),
  );

  const atRisk = recommendations
    .map((r) => r.student)
    .filter((s, i, arr) => s && arr.findIndex((x) => x?.id === s.id) === i);

  const soon = sessions.filter((s) => s.status === "SCHEDULED").slice(0, 8);
  const openRecs = visibleRecs.slice(0, 8);
  const recentNotes = notes.slice(0, 6);

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">
            Counseling
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Students flagged by the AI loop, upcoming sessions and guidance notes.
          </p>
        </div>
        <Badge tone="brand" className="flex items-center gap-1.5">
          <Sparkles size={13} /> {visibleRecs.length} open recommendations
        </Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Students needing attention"
              sub="AI recommendations mapped to the affected students"
            />
            <ul className="divide-y divide-line">
              {openRecs.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <Avatar name={r.student.user.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/students/${r.student.id}`}
                      className="text-[14px] font-bold text-ink-900 hover:text-brand-600"
                    >
                      {r.student.user.name}
                    </Link>
                    <p className="truncate text-[12px] text-ink-400">
                      {r.student.schoolClass.name} {r.student.schoolClass.section} ·{" "}
                      {r.title}
                    </p>
                  </div>
                  <Badge
                    tone={
                      r.kind === "ATTENDANCE" || r.kind === "DECLINE"
                        ? "danger"
                        : r.kind === "STRENGTH" || r.kind === "ON_TRACK"
                          ? "success"
                          : "warning"
                    }
                  >
                    {r.kind.replaceAll("_", " ").toLowerCase()}
                  </Badge>
                  <form action={refreshRecommendationsAction.bind(null, r.student.id)}>
                    <button
                      type="submit"
                      title="Re-analyze this student"
                      className="rounded-lg border border-line bg-card px-2.5 py-1.5 text-[12px] font-bold text-ink-500 transition hover:border-brand-300 hover:text-brand-600"
                    >
                      <Sparkles size={13} />
                    </button>
                  </form>
                </li>
              ))}
              {!openRecs.length && (
                <li className="px-5 py-10 text-center text-sm text-ink-500">
                  No open recommendations — students are on track.
                </li>
              )}
            </ul>
          </Card>

          <Card className="mt-5">
            <CardHeader title="Upcoming sessions" sub="Scheduled counseling appointments" />
            <ul className="divide-y divide-line">
              {soon.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <HeartHandshake size={16} className="text-brand-600" />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/students/${s.student.id}`}
                      className="text-[14px] font-bold text-ink-900 hover:text-brand-600"
                    >
                      {s.student.user.name}
                    </Link>
                    <p className="text-[12px] text-ink-400">
                      {s.scheduledFor.toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                      {" · "}with {s.counselor.name}
                    </p>
                  </div>
                  <form action={updateSessionStatusAction.bind(null, s.id, "COMPLETED")}>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-mint-200 bg-mint-500/10 px-3 py-1.5 text-[12px] font-bold text-mint-600 transition hover:bg-mint-500/20"
                    >
                      <UserCheck size={13} /> Mark done
                    </button>
                  </form>
                </li>
              ))}
              {!soon.length && (
                <li className="px-5 py-10 text-center text-sm text-ink-500">
                  No upcoming sessions scheduled.
                </li>
              )}
            </ul>
          </Card>

          <Card className="mt-5">
            <CardHeader title="Recent guidance notes" sub="Teacher and counselor entries" />
            <ul className="divide-y divide-line">
              {recentNotes.map((n) => (
                <li key={n.id} className="flex items-start justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-bold text-ink-900">{n.title}</p>
                    <p className="text-[12.5px] leading-relaxed text-ink-600">{n.body}</p>
                    <p className="mt-1 text-[11.5px] text-ink-400">
                      {n.author.name} · {n.student.user.name} ·{" "}
                      {n.createdAt.toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    </p>
                  </div>
                  <Badge tone="neutral">{n.category}</Badge>
                </li>
              ))}
              {!recentNotes.length && (
                <li className="px-5 py-10 text-center text-sm text-ink-500">
                  No guidance notes yet.
                </li>
              )}
            </ul>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Schedule a session" />
            <form action={scheduleSessionAction} className="space-y-3 p-5 pt-4">
              <Field>
                <label className={labelCls} htmlFor="studentId">Student</label>
                <select id="studentId" name="studentId" required className={inputCls}>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.user.name} — {s.schoolClass.name}
                      {s.schoolClass.section}
                    </option>
                  ))}
                </select>
              </Field>
              <Field>
                <label className={labelCls} htmlFor="when">Date &amp; time</label>
                <input id="when" type="datetime-local" name="when" required className={inputCls} />
              </Field>
              <Field>
                <label className={labelCls} htmlFor="notes">Purpose / notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  placeholder="Decline in Mathematics, needs study-plan support…"
                  className={inputCls}
                />
              </Field>
              <Button type="submit" className="w-full justify-center">
                <CalendarPlus size={16} /> Schedule session
              </Button>
            </form>
          </Card>

          <Card>
            <CardHeader title="Add guidance note" />
            <form action={createGuidanceNoteAction} className="space-y-3 p-5 pt-4">
              <Field>
                <label className={labelCls} htmlFor="noteStudent">Student</label>
                <select id="noteStudent" name="studentId" required className={inputCls}>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.user.name} — {s.schoolClass.name}
                      {s.schoolClass.section}
                    </option>
                  ))}
                </select>
              </Field>
              <Field>
                <label className={labelCls} htmlFor="category">Category</label>
                <select id="category" name="category" className={inputCls}>
                  <option value="ACADEMIC">Academic</option>
                  <option value="ATTENDANCE">Attendance</option>
                  <option value="BEHAVIOR">Behavior</option>
                  <option value="WELLBEING">Wellbeing</option>
                  <option value="CAREER">Career</option>
                </select>
              </Field>
              <Field>
                <label className={labelCls} htmlFor="title">Title</label>
                <input id="title" name="title" required placeholder="Improving homework consistency" className={inputCls} />
              </Field>
              <Field>
                <label className={labelCls} htmlFor="body">Note</label>
                <textarea
                  id="body"
                  name="body"
                  rows={3}
                  required
                  placeholder="Observed improvement after the parent meeting…"
                  className={inputCls}
                />
              </Field>
              <Button type="submit" variant="outline" className="w-full justify-center">
                <NotebookPen size={16} /> Save note
              </Button>
            </form>
          </Card>

          <Card className="p-5">
            <p className="text-[11.5px] font-bold uppercase tracking-wider text-ink-400">
              Attention queue
            </p>
            <ul className="mt-2.5 space-y-2">
              {atRisk.slice(0, 6).map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/students/${s.id}`}
                    className="flex items-center justify-between rounded-lg border border-line bg-surface/60 px-3 py-2 text-[13px] transition hover:border-brand-300"
                  >
                    <span className="font-bold text-ink-900">{s.user.name}</span>
                    <span className="text-[12px] text-ink-400">
                      {s.schoolClass.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
