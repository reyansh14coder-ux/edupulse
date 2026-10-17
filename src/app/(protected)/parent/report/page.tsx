import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Mail,
  Target,
} from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { weeklyReport } from "@/lib/insights";
import { fmtDate, pct } from "@/lib/utils";
import {
  Avatar,
  Badge,
  Card,
  CardHeader,
  PageHeader,
  Progress,
} from "@/components/ui";

export const metadata = { title: "Weekly report" };

export default async function ParentReportPage() {
  const session = await requireSession(["PARENT"]);
  const links = await db.parentLink.findMany({
    where: { parentId: session.sub },
    include: {
      student: {
        include: {
          user: { select: { name: true } },
          schoolClass: true,
          guidance: {
            include: { author: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
      },
    },
  });
  if (!links.length) notFound();

  const active = links[0].student;
  const report = await weeklyReport(active.id);
  if (!report) notFound();

  return (
    <div className="mx-auto max-w-4xl animate-fade-in">
      <Link
        href="/parent"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-500 transition hover:text-brand-600"
      >
        <ArrowLeft size={14} /> Back to overview
      </Link>

      <PageHeader
        title="Weekly progress report"
        sub="Generated automatically every week from attendance, assessments and submitted work."
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
              Reporting period
            </p>
            <p className="font-display text-[15px] font-extrabold text-ink-900">
              {report.periodLabel}
            </p>
          </div>
        </div>

        <div className="border-b border-line px-6 py-5">
          <div className="flex items-center gap-2">
            <Mail size={15} className="text-brand-600" />
            <h3 className="font-display text-[14.5px] font-extrabold text-ink-900">
              Summary for parents
            </h3>
          </div>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-700">
            {report.summary}
          </p>
        </div>

        <div className="grid border-b border-line sm:grid-cols-3">
          <div className="border-b border-line p-5 sm:border-b-0 sm:border-r">
            <p className="text-[11.5px] font-bold uppercase tracking-wider text-ink-400">
              Overall average
            </p>
            <p className="mt-1 font-display text-3xl font-extrabold text-ink-900">
              {pct(report.overall)}
            </p>
            <Progress value={report.overall} className="mt-2.5" />
          </div>
          <div className="border-b border-line p-5 sm:border-b-0 sm:border-r">
            <p className="text-[11.5px] font-bold uppercase tracking-wider text-ink-400">
              Attendance this week
            </p>
            <p className="mt-1 font-display text-3xl font-extrabold text-ink-900">
              {report.attendance.present}/{report.attendance.total}
            </p>
            <p className="mt-1 text-[13px] font-bold text-ink-500">
              {pct(report.attendance.pct)} present
            </p>
          </div>
          <div className="p-5">
            <p className="text-[11.5px] font-bold uppercase tracking-wider text-ink-400">
              Assessments this week
            </p>
            <p className="mt-1 font-display text-3xl font-extrabold text-ink-900">
              {report.assessments.length}
            </p>
            <p className="mt-1 text-[13px] font-bold text-ink-500">
              {report.homework.length} homework items due
            </p>
          </div>
        </div>

        <div className="grid border-b border-line lg:grid-cols-2">
          <div className="border-b border-line p-6 lg:border-b-0 lg:border-r">
            <h3 className="flex items-center gap-2 font-display text-[14.5px] font-extrabold text-ink-900">
              <CheckCircle2 size={16} className="text-mint-600" /> Highlights
            </h3>
            <ul className="mt-3 space-y-2.5">
              {report.highlights.map((h, i) => (
                <li key={i} className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mint-500" />
                  {h}
                </li>
              ))}
              {!report.highlights.length && (
                <li className="text-[13px] text-ink-500">A steady week overall.</li>
              )}
            </ul>
          </div>
          <div className="p-6">
            <h3 className="flex items-center gap-2 font-display text-[14.5px] font-extrabold text-ink-900">
              <AlertTriangle size={16} className="text-accent-500" /> Needs attention
            </h3>
            <ul className="mt-3 space-y-2.5">
              {report.concerns.map((c, i) => (
                <li key={i} className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
                  {c}
                </li>
              ))}
              {!report.concerns.length && (
                <li className="text-[13px] text-ink-500">
                  No concerns this week — keep supporting the routine.
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-b border-line p-6">
          <h3 className="flex items-center gap-2 font-display text-[14.5px] font-extrabold text-ink-900">
            <CalendarDays size={16} className="text-brand-600" /> This week&apos;s assessments
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
            <p className="mt-2 text-[13px] text-ink-500">
              No graded assessments this week.
            </p>
          )}
        </div>

        {report.attendance.absents.length > 0 && (
          <div className="border-b border-line p-6">
            <h3 className="font-display text-[14.5px] font-extrabold text-ink-900">
              Absences this week
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
            <Target size={16} className="text-violet-600" /> Suggested focus for next week
          </h3>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-700">
            {report.focusNext}
          </p>
        </div>

        {active.guidance.length > 0 && (
          <div className="p-6">
            <h3 className="font-display text-[14.5px] font-extrabold text-ink-900">
              Teacher &amp; counselor notes
            </h3>
            <ul className="mt-3 space-y-3">
              {active.guidance.map((g) => (
                <li key={g.id} className="rounded-xl border border-line bg-surface/60 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="brand">{g.category}</Badge>
                    <span className="text-[12.5px] text-ink-500">
                      {g.author.name} · {fmtDate(g.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1.5 font-display text-[14px] font-extrabold text-ink-900">
                    {g.title}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-600">{g.body}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <p className="mt-4 text-center text-[12.5px] text-ink-400">
        Sent automatically to parents every Monday · Powered by EduPulse analysis
      </p>
    </div>
  );
}
