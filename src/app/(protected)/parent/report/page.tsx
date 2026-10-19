import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ListChecks,
  Mail,
  MessageSquare,
  Sparkles,
  Target,
} from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { weeklyReport } from "@/lib/insights";
import { logAudit } from "@/lib/audit";
import {
  LANGS,
  REPORT_COPY,
  isLang,
  type Lang,
} from "@/lib/report-i18n";
import { fmtDate, pct } from "@/lib/utils";
import { PrintButton, ShareReportButton } from "@/components/report-actions";
import {
  Avatar,
  Badge,
  Card,
  Delta,
  PageHeader,
  Progress,
} from "@/components/ui";

export const metadata = { title: "Weekly report" };

export default async function ParentReportPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const session = await requireSession(["PARENT"]);
  const { lang: rawLang } = await searchParams;
  const lang: Lang = isLang(rawLang) ? rawLang : "en";
  const t = REPORT_COPY[lang];

  const links = await db.parentLink.findMany({
    where: { parentId: session.sub },
    include: {
      student: {
        include: {
          user: { select: { name: true } },
          schoolClass: true,
        },
      },
    },
  });
  if (!links.length) notFound();

  const active = links[0].student;
  const report = await weeklyReport(active.id, lang);
  if (!report) notFound();

  await logAudit("VIEW_WEEKLY_REPORT", {
    subject: active.user.name,
    detail: `Language: ${lang.toUpperCase()} · period ${report.periodLabel}`,
  });

  return (
    <div className="mx-auto max-w-4xl animate-fade-in">
      <Link
        href="/parent"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-500 transition hover:text-brand-600"
      >
        <ArrowLeft size={14} /> {t.back}
      </Link>

      <PageHeader
        title={t.title}
        sub={t.sub}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex overflow-hidden rounded-xl border border-line bg-card">
              {LANGS.map((l) => (
                <Link
                  key={l.code}
                  href={`/parent/report?lang=${l.code}`}
                  className={`px-3 py-2 text-[12.5px] font-bold transition ${
                    l.code === lang
                      ? "bg-brand-600 text-white"
                      : "text-ink-500 hover:bg-ink-100 hover:text-ink-800"
                  }`}
                  title={l.label}
                >
                  {l.native}
                </Link>
              ))}
            </div>
            <PrintButton label={t.print} />
          </div>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-4 border-b border-line bg-gradient-to-r from-brand-50/80 to-violet-50/60 px-6 py-5">
          <Avatar name={active.user.name} size="lg" />
          <div className="min-w-0">
            <p className="font-display text-lg font-extrabold text-ink-900">
              {active.user.name}
            </p>
            <p className="text-[13px] text-ink-500">
              {active.schoolClass.name} {active.schoolClass.section} ·{" "}
              {active.schoolClass.board} · Roll {active.rollNo}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[11.5px] font-bold uppercase tracking-wider text-ink-400">
              {t.period}
            </p>
            <p className="font-display text-[15px] font-extrabold text-ink-900">
              {report.periodLabel}
            </p>
            <p className="mt-0.5">
              {report.delta !== null ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 ring-1 ring-line">
                  <Delta value={report.delta} />
                  <span className="text-[11.5px] font-bold text-ink-500">{t.delta}</span>
                </span>
              ) : (
                <span className="text-[11.5px] font-semibold text-ink-400">
                  {t.noDelta}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="border-b border-line px-6 py-5">
          <div className="flex items-center gap-2">
            <Mail size={15} className="text-brand-600" />
            <h3 className="font-display text-[14.5px] font-extrabold text-ink-900">
              {t.summaryTitle}
            </h3>
          </div>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-700">
            {report.summary}
          </p>
        </div>

        <div className="grid border-b border-line sm:grid-cols-3">
          <div className="border-b border-line p-5 sm:border-b-0 sm:border-r">
            <p className="text-[11.5px] font-bold uppercase tracking-wider text-ink-400">
              {t.overall}
            </p>
            <p className="mt-1 font-display text-3xl font-extrabold text-ink-900">
              {pct(report.overall)}
            </p>
            <Progress value={report.overall} className="mt-2.5" />
          </div>
          <div className="border-b border-line p-5 sm:border-b-0 sm:border-r">
            <p className="text-[11.5px] font-bold uppercase tracking-wider text-ink-400">
              {t.attendanceWeek}
            </p>
            <p className="mt-1 font-display text-3xl font-extrabold text-ink-900">
              {report.attendance.present}/{report.attendance.total}
            </p>
            <p className="mt-1 text-[13px] font-bold text-ink-500">
              {pct(report.attendance.pct)} {t.present}
            </p>
          </div>
          <div className="p-5">
            <p className="text-[11.5px] font-bold uppercase tracking-wider text-ink-400">
              {t.assessmentsWeek}
            </p>
            <p className="mt-1 font-display text-3xl font-extrabold text-ink-900">
              {report.assessments.length}
            </p>
            <p className="mt-1 text-[13px] font-bold text-ink-500">
              {report.homework.length} {t.homeworkDue}
            </p>
          </div>
        </div>

        <div className="border-b border-line p-6">
          <h3 className="flex items-center gap-2 font-display text-[14.5px] font-extrabold text-ink-900">
            <Sparkles size={16} className="text-violet-500" />{" "}
            {t.aiSummaryTitle}
          </h3>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-700">
            <span className="font-bold text-ink-800">{t.studiesLabel}:</span>{" "}
            {report.general.studies}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-mint-200 bg-mint-500/5 p-4">
              <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wider text-mint-600">
                <CheckCircle2 size={12} /> {t.achievements}
              </p>
              <ul className="mt-2 space-y-2">
                {report.general.achievements.map((a, i) => (
                  <li
                    key={i}
                    className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink-700"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mint-500" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4">
              <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wider text-rose-500">
                <Target size={12} /> {t.focusAreas}
              </p>
              <ul className="mt-2 space-y-2">
                {report.general.focus.map((f, i) => (
                  <li
                    key={i}
                    className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink-700"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/60 p-4">
            <p className="text-[11.5px] font-bold uppercase tracking-wider text-violet-600">
              {t.adviceLabel}
            </p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-ink-700">
              {report.general.advice}
            </p>
          </div>
        </div>

        <div className="grid border-b border-line lg:grid-cols-2">
          <div className="border-b border-line p-6 lg:border-b-0 lg:border-r">
            <h3 className="flex items-center gap-2 font-display text-[14.5px] font-extrabold text-ink-900">
              <CheckCircle2 size={16} className="text-mint-600" /> {t.highlights}
            </h3>
            <ul className="mt-3 space-y-2.5">
              {report.highlights.map((h, i) => (
                <li key={i} className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mint-500" />
                  {h}
                </li>
              ))}
              {!report.highlights.length && (
                <li className="text-[13px] text-ink-500">{t.emptyHighlights}</li>
              )}
            </ul>
          </div>
          <div className="p-6">
            <h3 className="flex items-center gap-2 font-display text-[14.5px] font-extrabold text-ink-900">
              <AlertTriangle size={16} className="text-accent-500" /> {t.concerns}
            </h3>
            <ul className="mt-3 space-y-2.5">
              {report.concerns.map((c, i) => (
                <li key={i} className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
                  {c}
                </li>
              ))}
              {!report.concerns.length && (
                <li className="text-[13px] text-ink-500">{t.emptyConcerns}</li>
              )}
            </ul>
          </div>
        </div>

        <div className="grid border-b border-line lg:grid-cols-3">
          <div className="border-b border-line p-6 lg:col-span-2 lg:border-b-0 lg:border-r">
            <h3 className="flex items-center gap-2 font-display text-[14.5px] font-extrabold text-ink-900">
              <BookOpen size={16} className="text-brand-600" />{" "}
              {t.subjectsTitle}
            </h3>
            <p className="mt-1 text-[12.5px] text-ink-500">{t.subjectsSub}</p>
            <ul className="mt-3 space-y-3">
              {report.subjects.map((s, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-line bg-surface/60 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-[14px] font-extrabold text-ink-900">
                      {s.subject}
                    </span>
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[12px] font-extrabold text-brand-600">
                      {pct(s.avg)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Delta value={s.trend} />
                      <span className="text-[11.5px] font-semibold text-ink-400">
                        {t.delta}
                      </span>
                    </span>
                    <span className="text-[11.5px] text-ink-400">
                      {s.count} assessment{s.count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-700">
                    {s.rec}
                  </p>
                  {s.weakChapters.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {s.weakChapters.map((ch) => (
                        <Badge key={ch} tone="warning">
                          {ch}
                        </Badge>
                      ))}
                    </div>
                  )}
                </li>
              ))}
              {!report.subjects.length && (
                <li className="text-[13px] text-ink-500">{t.noSubjects}</li>
              )}
            </ul>
          </div>
          <div className="p-6">
            <h3 className="flex items-center gap-2 font-display text-[14.5px] font-extrabold text-ink-900">
              <MessageSquare size={16} className="text-violet-600" />{" "}
              {t.teacherAdvice}
            </h3>
            <ul className="mt-3 space-y-3">
              {report.notes.map((n) => (
                <li
                  key={n.id}
                  className="rounded-xl border border-violet-100 bg-violet-50/40 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={n.kind === "Teacher" ? "brand" : "success"}>
                      {n.kind === "Teacher" ? n.category : "Counselor"}
                    </Badge>
                    <span className="text-[12px] text-ink-500">
                      {n.author} · {fmtDate(n.date)}
                    </span>
                  </div>
                  <p className="mt-1.5 font-display text-[13.5px] font-extrabold text-ink-900">
                    {n.title}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-600">
                    {n.excerpt}
                  </p>
                </li>
              ))}
              {!report.notes.length && (
                <li className="text-[13px] text-ink-500">
                  {t.noTeacherAdvice}
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-b border-line p-6">
          <h3 className="flex items-center gap-2 font-display text-[14.5px] font-extrabold text-ink-900">
            <CalendarDays size={16} className="text-brand-600" /> {t.assessmentsTable}
          </h3>
          {report.assessments.length ? (
            <table className="mt-3 w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-ink-400">
                  <th className="py-2 font-bold">Assessment</th>
                  <th className="py-2 font-bold">Subject</th>
                  <th className="py-2 font-bold">Date</th>
                  <th className="py-2 font-bold text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {report.assessments.map((a, i) => (
                  <tr key={i} className="border-t border-line">
                    <td className="py-2.5 font-semibold text-ink-900">{a.title}</td>
                    <td className="py-2.5 text-ink-600">{a.subject}</td>
                    <td className="py-2.5 text-ink-500">{fmtDate(a.date)}</td>
                    <td className="py-2.5 text-right">
                      <span className="font-extrabold text-ink-900">{a.score}</span>
                      <span
                        className={`ml-2 font-bold ${
                          a.pct >= 75
                            ? "text-mint-600"
                            : a.pct >= 50
                              ? "text-accent-600"
                              : "text-rose-600"
                        }`}
                      >
                        {Math.round(a.pct)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="mt-2 text-[13px] text-ink-500">{t.noAssessments}</p>
          )}
        </div>

        {report.attendance.absents.length > 0 && (
          <div className="border-b border-line p-6">
            <h3 className="font-display text-[14.5px] font-extrabold text-ink-900">
              {t.absences}
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {report.attendance.absents.map((d) => (
                <Badge key={d} tone="danger">{d}</Badge>
              ))}
            </div>
          </div>
        )}

        <div className="border-b border-line p-6">
          <h3 className="flex items-center gap-2 font-display text-[14.5px] font-extrabold text-ink-900">
            <ListChecks size={16} className="text-mint-600" /> {t.plans}
          </h3>
          <div className="mt-3 space-y-3">
            {report.plans.map((p, i) => (
              <div key={i} className="rounded-xl border border-mint-200 bg-mint-500/5 p-4">
                <p className="font-display text-[14px] font-extrabold text-ink-900">
                  {p.title}
                </p>
                <ol className="mt-1.5 space-y-1">
                  {p.plan.split("\n").filter(Boolean).map((line, j) => (
                    <li key={j} className="text-[13.5px] leading-relaxed text-ink-700">
                      {line}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
            {!report.plans.length && (
              <p className="text-[13px] text-ink-500">{t.noPlans}</p>
            )}
          </div>
        </div>

        <div className="border-b border-line p-6">
          <h3 className="flex items-center gap-2 font-display text-[14.5px] font-extrabold text-ink-900">
            <Target size={16} className="text-violet-600" /> {t.focus}
          </h3>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-700">
            {report.focusNext}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <p className="text-[12.5px] text-ink-400">{t.footer}</p>
          <ShareReportButton label={t.share} />
        </div>
      </Card>

      <p className="mt-4 text-center text-[12px] text-ink-400">
        Privacy-first: every view and share is recorded in the school&apos;s audit log.
      </p>
    </div>
  );
}
