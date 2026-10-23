import { BookOpen, Mail, Sparkles, ThumbsDown, ThumbsUp, Users } from "lucide-react";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { teacherPerformance } from "@/lib/admin";
import { pct } from "@/lib/utils";
import { logTeacherFeedbackAction, setFeedbackStatusAction } from "@/app/actions/feedback";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  inputCls,
} from "@/components/ui";

export const metadata = { title: "Teachers" };

export default async function AdminTeachersPage() {
  await requireSession(["ADMIN"]);

  const [teachers, staff] = await Promise.all([
    teacherPerformance(),
    db.user.findMany({
      where: { role: "TEACHER" },
      include: {
        homeworks: { take: 1, orderBy: { assignedOn: "desc" } },
        feedbackAbout: { orderBy: { createdAt: "desc" }, take: 5, include: { author: { select: { name: true } } } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const openComplaints = teachers.reduce((a, t) => a + t.complaints, 0);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Teachers"
        sub={`${teachers.length} teaching staff · weekly performance report · ${openComplaints} open feedback item(s)`}
      />

      <Card className="mb-5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-gradient-to-r from-brand-50/70 via-white to-mint-50/60 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="rounded-lg bg-brand-600/10 p-1.5 text-brand-600">
              <Sparkles size={16} />
            </span>
            <div>
              <p className="text-[14px] font-extrabold text-ink-900">Teacher performance report</p>
              <p className="text-[11.5px] text-ink-500">
                Composite score from student averages, % good students, attendance &amp; open complaints
              </p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-surface/70">
              <tr className="text-[11px] uppercase tracking-wider text-ink-400">
                <th className="px-5 py-3 font-bold">Teacher</th>
                <th className="px-4 py-3 font-bold">Classes</th>
                <th className="px-4 py-3 font-bold">Students</th>
                <th className="px-4 py-3 font-bold">Class avg</th>
                <th className="px-4 py-3 font-bold">% good (≥75)</th>
                <th className="px-4 py-3 font-bold">Attendance</th>
                <th className="px-4 py-3 font-bold">Homework (4w)</th>
                <th className="px-4 py-3 font-bold">Δ week</th>
                <th className="px-4 py-3 font-bold">Feedback</th>
                <th className="px-4 py-3 font-bold">Score</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id} className="border-t border-line transition hover:bg-surface/60">
                  <td className="px-5 py-3">
                    <Link href={`/admin/teachers`} className="font-bold text-ink-900 hover:text-brand-700">{t.name}</Link>
                    <p className="text-[11.5px] text-ink-400">{t.subjects.join(", ")}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-700">{t.classes.join(" · ") || "—"}</td>
                  <td className="px-4 py-3 font-bold text-ink-900">{t.students}</td>
                  <td className="px-4 py-3 font-bold text-ink-900">{pct(t.avgScore)}</td>
                  <td className="px-4 py-3 font-bold text-ink-900">{Math.round(t.goodPct)}%</td>
                  <td className="px-4 py-3 font-bold text-ink-900">{Math.round(t.attendancePct)}%</td>
                  <td className="px-4 py-3 text-ink-700">{t.homeworkCount}</td>
                  <td className="px-4 py-3">
                    <span className={t.weeklyDelta >= 0 ? "font-bold text-mint-600" : "font-bold text-rose-600"}>
                      {t.weeklyDelta >= 0 ? "▲" : "▼"} {Math.abs(Math.round(t.weeklyDelta))} pts
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex gap-1.5">
                      {t.complaints > 0 && <Badge tone="danger">{t.complaints} complaint</Badge>}
                      {t.praises > 0 && <Badge tone="success">{t.praises} praise</Badge>}
                      {t.complaints === 0 && t.praises === 0 && <span className="text-ink-400">—</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={t.score >= 75 ? "success" : t.score >= 60 ? "warning" : "danger"}>{t.score}%</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!teachers.length && (
            <EmptyState title="No teachers yet" hint="Add teachers from setup." icon={<Users size={20} />} />
          )}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {staff.map((t) => {
          const perf = teachers.find((x) => x.id === t.id);
          const classes = perf?.classes ?? [];
          const subjects = perf?.subjects ?? [];
          const students = perf?.students ?? 0;
          return (
            <Card key={t.id} className="p-5 transition hover:-translate-y-0.5 hover:shadow-pop/40">
              <div className="flex items-start gap-3.5">
                <Avatar name={t.name} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display text-[15.5px] font-extrabold text-ink-900">{t.name}</p>
                    {perf && (
                      <Badge tone={perf.score >= 75 ? "success" : perf.score >= 60 ? "warning" : "danger"}>
                        {perf.score}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-[12.5px] text-ink-500">{t.title ?? "Teacher"}</p>
                  <a href={`mailto:${t.email}`} className="mt-1 flex items-center gap-1.5 text-[12.5px] text-ink-400 hover:text-brand-600">
                    <Mail size={12} /> {t.email}
                  </a>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {subjects.map((s) => (
                  <Badge key={s} tone="brand">{s}</Badge>
                ))}
              </div>

              {perf && (
                <div className="mt-4 grid grid-cols-4 gap-2 border-t border-line pt-4 text-center">
                  <div>
                    <p className="font-display text-base font-extrabold text-ink-900">{pct(perf.avgScore)}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">Avg</p>
                  </div>
                  <div>
                    <p className="font-display text-base font-extrabold text-ink-900">{Math.round(perf.goodPct)}%</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">Good</p>
                  </div>
                  <div>
                    <p className="font-display text-base font-extrabold text-ink-900">{perf.homeworkCount}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">HW 4w</p>
                  </div>
                  <div>
                    <p className={`font-display text-base font-extrabold ${perf.weeklyDelta >= 0 ? "text-mint-600" : "text-rose-600"}`}>
                      {perf.weeklyDelta >= 0 ? "▲" : "▼"}{Math.abs(Math.round(perf.weeklyDelta))}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">Δ wk</p>
                  </div>
                </div>
              )}

              {perf && perf.complaints > 0 && (
                <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-[12px] font-bold text-rose-600">
                  <ThumbsDown size={13} /> {perf.complaints} open complaint(s) — review below
                </p>
              )}
              {perf && perf.praises > 0 && (
                <p className="mt-2 flex items-center gap-1.5 text-[12px] text-mint-600">
                  <ThumbsUp size={13} /> {perf.praises} praise received
                </p>
              )}

              <p className="mt-3 flex items-center gap-1.5 text-[12px] text-ink-500">
                <Users size={12} className="text-ink-400" /> {classes.join(" · ") || "No classes"}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-500">
                <BookOpen size={12} className="text-ink-400" />
                {students} students · last HW:{" "}
                {t.homeworks[0]
                  ? new Date(t.homeworks[0].assignedOn).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                  : "—"}
              </p>

              {t.feedbackAbout.length > 0 && (
                <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
                  {t.feedbackAbout.slice(0, 3).map((f) => (
                    <li key={f.id} className="text-[12px] text-ink-600">
                      <span className="font-bold text-ink-800">[{f.category}]</span> {f.body.slice(0, 90)}
                      {f.body.length > 90 ? "…" : ""}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="mt-5">
        <CardHeader
          title="Teacher feedback / complaints"
          sub="Logged concerns & praise reach the admin here. Mark reviewed or resolved."
        />
        <div className="grid gap-5 px-5 pb-5 pt-3 lg:grid-cols-[1fr_320px]">
          <ul className="divide-y divide-line">
            {(await db.teacherFeedback.findMany({
              include: { teacher: { select: { name: true } }, author: { select: { name: true } } },
              orderBy: { createdAt: "desc" },
              take: 20,
            })).map((f) => (
              <li key={f.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-bold text-ink-900">
                    {f.category === "COMPLAINT" ? "Complaint" : f.category === "PRAISE" ? "Praise" : "Suggestion"} · {f.teacher.name}
                  </p>
                  <p className="text-[12.5px] leading-relaxed text-ink-600">{f.body}</p>
                  <p className="mt-0.5 text-[11.5px] text-ink-400">
                    {f.author?.name ?? "Unknown"} · {f.createdAt.toLocaleDateString("en-IN", { dateStyle: "medium" })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={f.status === "RESOLVED" ? "success" : f.status === "REVIEWED" ? "info" : "danger"}>
                    {f.status.toLowerCase()}
                  </Badge>
                  {f.status !== "REVIEWED" && f.status !== "RESOLVED" && (
                    <MarkBtn id={f.id} status="REVIEWED" label="Review" />
                  )}
                  {f.status !== "RESOLVED" && (
                    <MarkBtn id={f.id} status="RESOLVED" label="Resolve" />
                  )}
                </div>
              </li>
            ))}
            {!(await db.teacherFeedback.count()) && (
              <li className="py-8 text-center text-[13px] text-ink-500">
                No feedback yet — complaints and praise logged here will appear for admin review.
              </li>
            )}
          </ul>

          <Card className="p-4">
            <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-ink-400">Log feedback</p>
            <FeedbackForm teachers={staff.map((s) => ({ id: s.id, name: s.name }))} />
          </Card>
        </div>
      </Card>
    </div>
  );
}

function MarkBtn({ id, status, label }: { id: string; status: string; label: string }) {
  return (
    <form action={setFeedbackStatusAction.bind(null, id, status)}>
      <button
        type="submit"
        className="rounded-lg border border-line bg-card px-2.5 py-1 text-[11.5px] font-bold text-ink-600 transition hover:border-brand-300 hover:text-brand-700"
      >
        {label}
      </button>
    </form>
  );
}

function FeedbackForm({ teachers }: { teachers: { id: string; name: string }[] }) {
  return (
    <form action={logTeacherFeedbackAction} className="space-y-2.5">
      <select name="teacherId" required className={inputCls}>
        <option value="">Select teacher…</option>
        {teachers.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      <select name="category" className={inputCls}>
        <option value="COMPLAINT">Complaint</option>
        <option value="PRAISE">Praise</option>
        <option value="SUGGESTION">Suggestion</option>
      </select>
      <textarea name="body" rows={3} required maxLength={800} placeholder="Describe the feedback…" className={inputCls} />
      <Button type="submit" variant="outline" className="w-full justify-center">
        Save feedback
      </Button>
    </form>
  );
}
