import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CalendarCheck2,
  ClipboardCheck,
  FileSpreadsheet,
  Gauge,
  Infinity as InfinityIcon,
  LineChart,
  NotebookPen,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Logo, Wordmark } from "@/components/logo";

const LOOP = [
  { icon: ClipboardCheck, title: "Collect", desc: "Marks, attendance and activities in one tap." },
  { icon: LineChart, title: "Track", desc: "Every score builds a continuous progress record." },
  { icon: BrainCircuit, title: "Analyze", desc: "Trends, weak subjects and risk flags, automatically." },
  { icon: Sparkles, title: "Recommend", desc: "AI study guidance for each student, in context." },
  { icon: FileSpreadsheet, title: "Assess", desc: "AI quizzes generated from the class syllabus." },
  { icon: RefreshCw, title: "Re-analyze", desc: "Quiz results feed straight back into analysis." },
  { icon: Target, title: "Improve", desc: "Students work on exactly what they need next." },
];

const ROLES = [
  {
    icon: ShieldCheck,
    title: "School admin",
    desc: "Full-school pulse: classes, teachers, at-risk students and setup — CBSE, board, syllabus and year in one place.",
    points: ["Student & teacher records", "Board / grade / syllabus setup", "School-wide risk overview"],
  },
  {
    icon: Users,
    title: "Teachers",
    desc: "Mark attendance, enter marks, post homework or assignments and create syllabus quizzes in seconds.",
    points: ["One-tap attendance", "Marks entry with live class stats", "AI quiz generator"],
  },
  {
    icon: BrainCircuit,
    title: "Students",
    desc: "A personal pulse of your progress, AI practice quizzes and clear next-step recommendations.",
    points: ["Progress dashboard", "Practice & class quizzes", "Personal AI recommendations"],
  },
  {
    icon: Gauge,
    title: "Parents",
    desc: "Automatic weekly reports — highlights, concerns, attendance and focus areas without waiting for PTM.",
    points: ["Weekly progress report", "Child-by-child overview", "Teacher & counselor notes"],
  },
];

const STATS = [
  { value: "7-step", label: "continuous improvement loop" },
  { value: "4", label: "role dashboards out of the box" },
  { value: "Weekly", label: "auto-generated parent reports" },
  { value: "AI", label: "recommendations & quizzes" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-surface text-ink-900">
      <header className="sticky top-0 z-40 glass border-b border-line">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <Logo />
            <Wordmark />
          </div>
          <nav className="hidden items-center gap-7 text-[13.5px] font-bold text-ink-600 md:flex">
            <a href="#loop" className="transition hover:text-brand-600">How it works</a>
            <a href="#roles" className="transition hover:text-brand-600">For every role</a>
            <a href="#ai" className="transition hover:text-brand-600">AI engine</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl px-3.5 py-2 text-[13.5px] font-bold text-ink-700 transition hover:text-brand-600"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-[13.5px] font-bold text-white shadow-[0_10px_30px_-12px_rgba(79,70,229,.7)] transition hover:bg-brand-700"
            >
              Try the demo <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="grid-pattern absolute inset-0 opacity-70" />
        <div className="absolute -top-28 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-500/25 via-violet-500/20 to-accent-500/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-16 text-center sm:pt-24">
          <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-brand-200 bg-card px-4 py-1.5 text-[12.5px] font-bold text-brand-700">
            <Sparkles size={13} /> EduPulse MVP · continuous student support
          </span>
          <h1 className="animate-fade-up mx-auto mt-6 max-w-3xl font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-ink-950 sm:text-6xl">
            Every student&apos;s progress,{" "}
            <span className="gradient-text">monitored continuously</span> — not once a term.
          </h1>
          <p className="animate-fade-up mx-auto mt-5 max-w-2xl text-[16.5px] leading-relaxed text-ink-600">
            EduPulse brings a school&apos;s student data — marks, attendance, homework and
            syllabus — into one system, then loops it through{" "}
            <strong className="font-bold text-ink-900">analyze → recommend → assess →
            improve</strong> so teachers, students and parents always know the next step.
          </p>
          <div className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white shadow-pop transition hover:bg-brand-700"
            >
              Open live demo <ArrowRight size={16} />
            </Link>
            <a
              href="#loop"
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-card px-6 py-3.5 text-sm font-bold text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
            >
              See how the loop works
            </a>
          </div>
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-2xl border border-line bg-card/80 px-4 py-4 text-center">
                <p className="font-display text-xl font-extrabold text-ink-950">{s.value}</p>
                <p className="mt-0.5 text-[11.5px] font-semibold leading-tight text-ink-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="loop" className="mx-auto max-w-6xl px-5 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[12.5px] font-bold uppercase tracking-widest text-brand-600">
            The EduPulse loop
          </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink-950 sm:text-4xl">
            Seven steps that never stop running
          </h2>
          <p className="mt-3 text-[15.5px] leading-relaxed text-ink-600">
            Data flows in, intelligence flows out — and every assessment makes the next
            recommendation sharper.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LOOP.map((step, i) => (
            <div
              key={step.title}
              className="card group relative p-5 transition hover:-translate-y-1 hover:border-brand-300"
            >
              <span className="absolute right-4 top-4 font-display text-3xl font-extrabold text-ink-100 transition group-hover:text-brand-100">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <step.icon size={20} />
              </div>
              <p className="mt-3.5 font-display text-[15.5px] font-extrabold text-ink-950">
                {step.title}
              </p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-ink-600">{step.desc}</p>
            </div>
          ))}
          <div className="card flex flex-col justify-center bg-gradient-to-br from-brand-600 to-violet-600 p-5 text-white">
            <InfinityIcon size={26} />
            <p className="mt-3 font-display text-[15.5px] font-extrabold">Then repeat.</p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-white/85">
              Each cycle narrows the gap between where a student is and where they should be.
            </p>
          </div>
        </div>
      </section>

      <section id="roles" className="border-y border-line bg-card">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12.5px] font-bold uppercase tracking-widest text-brand-600">
              One platform, four dashboards
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink-950 sm:text-4xl">
              Built for everyone in the school
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {ROLES.map((r) => (
              <div key={r.title} className="card p-6 transition hover:border-brand-300">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 text-white">
                    <r.icon size={20} />
                  </div>
                  <h3 className="font-display text-lg font-extrabold text-ink-950">{r.title}</h3>
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-ink-600">{r.desc}</p>
                <ul className="mt-4 space-y-2">
                  {r.points.map((p) => (
                    <li key={p} className="flex items-center gap-2.5 text-[13.5px] font-semibold text-ink-700">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-mint-500/15 text-[11px] font-extrabold text-mint-600">
                        ✓
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="ai" className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-[12.5px] font-bold uppercase tracking-widest text-brand-600">
              AI engine
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink-950 sm:text-4xl">
              Recommendations that know the syllabus
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-ink-600">
              EduPulse reads marks, attendance trends, homework discipline and chapter
              coverage — then writes specific, actionable guidance for each student. Take a
              quiz, and your result immediately re-runs the analysis.
            </p>
            <div className="mt-6 space-y-3">
              {[
                { icon: BarChart3, t: "Weak-subject & decline detection", d: "Spot a drop before the report card does." },
                { icon: FileSpreadsheet, t: "Syllabus-aware quizzes", d: "MCQs generated from the class's own chapters." },
                { icon: CalendarCheck2, t: "Attendance risk alerts", d: "Flagged below 75% with recent-absence context." },
                { icon: NotebookPen, t: "Weekly parent reports", d: "Highlights, concerns and next-week focus, auto-written." },
              ].map((f) => (
                <div key={f.t} className="flex items-start gap-3.5 rounded-2xl border border-line bg-card p-4">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <f.icon size={17} />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-ink-900">{f.t}</p>
                    <p className="text-[13px] text-ink-500">{f.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-brand-500/20 to-violet-500/20 blur-2xl" />
            <div className="card relative overflow-hidden">
              <div className="border-b border-line bg-gradient-to-r from-brand-50 to-violet-50 px-5 py-4">
                <p className="font-display text-[15px] font-extrabold text-ink-950">
                  Sample AI recommendation
                </p>
              </div>
              <div className="space-y-4 p-5">
                <div className="rounded-2xl border border-accent-200 bg-accent-50/70 p-4">
                  <span className="inline-flex rounded-full bg-accent-500 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                    subject support
                  </span>
                  <p className="mt-2 font-display text-[14.5px] font-extrabold text-ink-950">
                    Mathematics needs focused practice
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-600">
                    Aarav averages 41% in Mathematics across the last 3 assessments — down 9
                    points this month. Chapters <em>Integers</em> and <em>Fractions</em>{" "}
                    need revision; a 10-question practice quiz is ready.
                  </p>
                </div>
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <span className="inline-flex rounded-full bg-rose-500 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                    attendance
                  </span>
                  <p className="mt-2 font-display text-[14.5px] font-extrabold text-ink-950">
                    Attendance below threshold
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-600">
                    71% this term with 3 absences in the last 10 school days — flag for a
                    parent conversation this week.
                  </p>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-mint-200 bg-mint-50 p-4">
                  <div>
                    <p className="font-display text-[14px] font-extrabold text-ink-950">
                      Science strength
                    </p>
                    <p className="text-[13px] text-ink-600">92% average — encourage the science olympiad.</p>
                  </div>
                  <Sparkles size={18} className="text-mint-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-6">
        <div className="card relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-violet-600 px-8 py-12 text-center text-white">
          <div className="grid-pattern absolute inset-0 opacity-20" />
          <h2 className="relative font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            See EduPulse in action
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-[15.5px] leading-relaxed text-white/85">
            A fully seeded demo school — Vidya Niketan Public School, CBSE — with students,
            teachers, marks, attendance and AI recommendations ready to explore.
          </p>
          <div className="relative mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-brand-700 shadow-float transition hover:bg-brand-50"
            >
              Launch demo dashboard <ArrowRight size={16} />
            </Link>
          </div>
          <p className="relative mt-4 text-[13px] text-white/70">
            Quick accounts: admin · teacher · parent · student — all password{" "}
            <code className="rounded bg-white/15 px-1.5 py-0.5 font-mono">demo123</code>
          </p>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8">
          <div className="flex items-center gap-2.5">
            <Logo className="h-7 w-7" />
            <span className="text-[13px] font-bold text-ink-500">
              EduPulse — continuous student support
            </span>
          </div>
          <p className="text-[12.5px] text-ink-400">
            Built with Next.js · Prisma · AI recommendations engine
          </p>
        </div>
      </footer>
    </div>
  );
}
