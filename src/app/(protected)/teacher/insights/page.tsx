import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  CalendarCheck,
  ClipboardList,
  BookOpen,
  Sparkles,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { classInsights } from "@/lib/insights";
import { cn } from "@/lib/utils";
import { SubjectBars } from "@/components/charts";
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  StatCard,
} from "@/components/ui";

export const metadata = { title: "Class insights" };

export default async function TeacherInsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const session = await requireSession(["TEACHER", "ADMIN"]);
  const { c } = await searchParams;

  const classes =
    session.role === "ADMIN"
      ? await db.schoolClass.findMany({ orderBy: [{ name: "asc" }, { section: "asc" }] })
      : (
          await db.teacherAssignment.findMany({
            where: { teacherId: session.sub },
            include: { schoolClass: true },
            orderBy: { schoolClass: { name: "asc" } },
          })
        ).map((a) => a.schoolClass);

  if (!classes.length) notFound();
  const classId = classes.some((k) => k.id === c) ? c! : classes[0].id;
  const insights = await classInsights(classId);
  if (!insights) notFound();

  const improvers = insights.movers.filter((m) => m.delta > 0);
  const decliners = insights.movers.filter((m) => m.delta < 0);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Class-wide learning insights"
        sub="Subject averages, hardest chapters, attendance–performance risk and movement — one screen per class."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {classes.map((k) => (
          <Link
            key={k.id}
            href={`/teacher/insights?c=${k.id}`}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[13px] font-bold transition",
              k.id === classId
                ? "bg-brand-600 text-white shadow-[0_8px_20px_-10px_rgba(79,70,229,.8)]"
                : "bg-card text-ink-600 ring-1 ring-line hover:ring-brand-300 hover:text-brand-700"
            )}
          >
            {k.name} – {k.section}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Class average"
          value={`${insights.classAvg}%`}
          hint={`Across ${insights.studentCount} students`}
          icon={<TrendingUp size={18} />}
          tone={insights.classAvg >= 60 ? "success" : "warning"}
        />
        <StatCard
          label="Attendance average"
          value={`${insights.attendanceAvg}%`}
          hint={
            insights.attendanceAvg >= 85
              ? "Healthy attendance"
              : "Below the 85% healthy line"
          }
          icon={<CalendarCheck size={18} />}
          tone={insights.attendanceAvg >= 85 ? "success" : "danger"}
        />
        <StatCard
          label="Hardest chapter"
          value={
            insights.hardestChapters[0]
              ? `${Math.max(insights.hardestChapters[0].pct, 0)}%`
              : "—"
          }
          hint={
            insights.hardestChapters[0]
              ? `${insights.hardestChapters[0].subject} · ${insights.hardestChapters[0].chapter}`
              : "No chapter-level quiz data yet"
          }
          icon={<TriangleAlert size={18} />}
          tone="warning"
        />
        <StatCard
          label="Quiz attempts"
          value={insights.quizCount}
          hint="Feeds back into recommendations"
          icon={<Sparkles size={18} />}
          tone="brand"
        />
      </div>

      <Card className="mt-5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-gradient-to-r from-brand-50/70 via-white to-mint-50/60 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="rounded-lg bg-brand-600/10 p-1.5 text-brand-600">
              <Sparkles size={16} />
            </span>
            <div>
              <p className="text-[14px] font-extrabold text-ink-900">
                This week's class brief
              </p>
              <p className="text-[11.5px] text-ink-500">
                Evidence-led summary and your next steps for {insights.className} – {insights.section}
              </p>
            </div>
          </div>
          <Badge tone={insights.aiBrief.source === "ai" ? "brand" : "neutral"}>
            {insights.aiBrief.source === "ai" ? "AI-generated" : "Data summary"}
          </Badge>
        </div>
        <div className="grid gap-5 px-5 py-4 sm:grid-cols-[1.2fr_1fr]">
          <p className="text-[14px] leading-relaxed text-ink-700">
            {insights.aiBrief.summary}
          </p>
          <ul className="space-y-2">
            {insights.aiBrief.actions.map((a, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13.5px] text-ink-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint-100 text-[11px] font-extrabold text-mint-700">
                  {i + 1}
                </span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Subject-wise averages"
            sub="Weakest subject first — plan revision and reteach accordingly"
          />
          <div className="px-3 pb-5 pt-3">
            {insights.subjectAvg.length ? (
              <SubjectBars data={insights.subjectAvg} height={240} />
            ) : (
              <EmptyState
                title="No graded assessments yet"
                hint="Enter marks for this class to see subject averages."
                icon={<ClipboardList size={20} />}
              />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Workload shortcuts"
            sub="The three tasks teachers repeat daily — one click away"
          />
          <div className="space-y-2.5 p-5 pt-3">
            {[
              { href: "/teacher/attendance", label: "Mark attendance", icon: <CalendarCheck size={15} />, hint: "All-present one-tap save" },
              { href: "/teacher/marks", label: "Enter marks", icon: <ClipboardList size={15} />, hint: "Bulk entry per assessment" },
              { href: "/teacher/homework", label: "Assign homework / quiz", icon: <BookOpen size={15} />, hint: "Create in one form" },
            ].map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface/60 px-4 py-3 transition hover:border-brand-300 hover:bg-brand-50/40"
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-brand-600">{s.icon}</span>
                  <span>
                    <span className="block text-[13.5px] font-bold text-ink-900">
                      {s.label}
                    </span>
                    <span className="block text-[11.5px] text-ink-500">{s.hint}</span>
                  </span>
                </span>
                <ArrowUpRight size={15} className="text-ink-400" />
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader
            title="Class understanding map"
            sub="Topic mastery across everyone who attempted — review chips mark whole-class gaps"
          />
          <ul className="divide-y divide-line">
            {insights.hardestChapters.map((ch, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-5 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-bold text-ink-900">
                    {ch.chapter}
                  </p>
                  <p className="text-[11.5px] text-ink-500">
                    {ch.subject} · {ch.students} students · {ch.attempts} responses
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-2">
                  {ch.pct < 55 && (
                    <Badge tone="warning">Review with class</Badge>
                  )}
                  <Badge tone={ch.pct < 50 ? "danger" : ch.pct < 75 ? "warning" : "success"}>
                    {ch.pct}%
                  </Badge>
                </span>
              </li>
            ))}
            {!insights.hardestChapters.length && (
              <li className="px-5 py-6 text-center text-[13px] text-ink-500">
                Assign quizzes with chapters to unlock chapter-level insight.
              </li>
            )}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Risk watchlist"
            sub="Attendance below 75% AND a class average on record"
            action={<Badge tone={insights.riskRows.length ? "danger" : "success"}>{insights.riskRows.length} students</Badge>}
          />
          <ul className="divide-y divide-line">
            {insights.riskRows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                <Link
                  href={`/students/${r.id}`}
                  className="truncate text-[13.5px] font-bold text-ink-900 hover:text-brand-600"
                >
                  {r.name}
                </Link>
                <span className="flex shrink-0 gap-2">
                  <Badge tone="danger">{r.att}% att</Badge>
                  <Badge tone={r.avg >= 50 ? "warning" : "danger"}>{r.avg}% avg</Badge>
                </span>
              </li>
            ))}
            {!insights.riskRows.length && (
              <li className="px-5 py-6 text-center text-[13px] text-ink-500">
                No attendance-performance risk in this class right now.
              </li>
            )}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Movement (last 30 days)"
            sub="Recent average vs earlier average"
          />
          <div className="space-y-4 p-5">
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wider text-mint-600">
                <TrendingUp size={12} /> Improving
              </p>
              {improvers.slice(0, 3).map((m) => (
                <p key={m.id} className="flex justify-between text-[13.5px] text-ink-700">
                  <span className="font-semibold">{m.name}</span>
                  <span className="font-extrabold text-mint-600">▲ {m.delta} pts</span>
                </p>
              ))}
              {!improvers.length && (
                <p className="text-[12.5px] text-ink-500">No improvers measured yet.</p>
              )}
            </div>
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wider text-rose-600">
                <TrendingDown size={12} /> Slipping
              </p>
              {decliners.slice(0, 3).map((m) => (
                <p key={m.id} className="flex justify-between text-[13.5px] text-ink-700">
                  <span className="font-semibold">{m.name}</span>
                  <span className="font-extrabold text-rose-600">▼ {Math.abs(m.delta)} pts</span>
                </p>
              ))}
              {!decliners.length && (
                <p className="text-[12.5px] text-ink-500">Nobody slipping — great sign.</p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
