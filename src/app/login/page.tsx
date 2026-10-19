"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  Eye,
  EyeOff,
  GraduationCap,
  HeartHandshake,
  Loader2,
  Newspaper,
  ShieldCheck,
} from "lucide-react";
import { loginAction, type LoginState } from "@/app/actions/auth";
import { Logo, Wordmark } from "@/components/logo";
import { btnPrimary, inputCls, labelCls } from "@/components/ui";
import { cn } from "@/lib/utils";

const DEMO = [
  {
    role: "Admin",
    email: "admin@vidyora.in",
    desc: "Principal · full school view",
    icon: <ShieldCheck size={16} />,
  },
  {
    role: "Teacher",
    email: "teacher@vidyora.in",
    desc: "Anjali Sharma · Mathematics",
    icon: <GraduationCap size={16} />,
  },
  {
    role: "Parent",
    email: "parent@vidyora.in",
    desc: "Rakesh Patel · weekly reports",
    icon: <Newspaper size={16} />,
  },
  {
    role: "Student",
    email: "student@vidyora.in",
    desc: "Aarav Patel · Class 6 A",
    icon: <BarChart3 size={16} />,
  },
];

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    null
  );
  const [show, setShow] = useState(false);
  const [filling, setFilling] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const quickFill = (email: string) => {
    setFilling(email);
    const form = formRef.current;
    if (form) {
      const emailInput = form.querySelector<HTMLInputElement>('[name="email"]');
      const passInput = form.querySelector<HTMLInputElement>('[name="password"]');
      if (emailInput) emailInput.value = email;
      if (passInput) passInput.value = "demo123";
      setTimeout(() => form.requestSubmit(), 200);
    }
    setTimeout(() => setFilling(null), 600);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden bg-ink-950 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(79,70,229,.85),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(124,58,237,.7),transparent_50%),radial-gradient(ellipse_at_center,rgba(245,158,11,.22),transparent_55%)]" />
        <div className="grid-pattern absolute inset-0 opacity-40" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo />
            <span className="font-display text-lg font-extrabold text-white">Vidyora</span>
          </Link>

          <div className="max-w-md animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[12px] font-bold text-white/90">
              <HeartHandshake size={13} /> Collect → Monitor → Analyze → Guide
            </span>
            <h1 className="mt-6 font-display text-[40px] font-extrabold leading-[1.06] tracking-tight text-white">
              Every student&apos;s pulse,
              <br />
              <span className="text-accent-400">in one place.</span>
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-white/70">
              Marks, attendance, homework and school activity — organized
              automatically, turned into weekly insights for teachers, parents
              and students.
            </p>
            <div className="mt-8 grid gap-3">
              {[
                ["CalendarCheck", "Attendance captured in seconds", <CalendarCheck key="a" size={16} />],
                ["Trends", "Insights that flag who needs support", <BarChart3 key="b" size={16} />],
                ["Reports", "Weekly parent updates, no meetings needed", <Newspaper key="c" size={16} />],
              ].map(([_, text, icon]) => (
                <div
                  key={String(text)}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 text-[14px] font-semibold text-white/85"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-accent-400">
                    {icon as React.ReactNode}
                  </span>
                  {text as string}
                </div>
              ))}
            </div>
          </div>

          <p className="text-[12.5px] text-white/45">
            Vidya Niketan Public School · demo environment with seeded data
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[420px] animate-fade-up">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <Logo />
            <Wordmark />
          </div>

          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">
            Welcome back
          </h2>
          <p className="mt-1.5 text-sm text-ink-500">
            Sign in to your school&apos;s progress dashboard.
          </p>

          <form ref={formRef} action={formAction} className="mt-7 space-y-4">
            <div>
              <label htmlFor="email" className={labelCls}>
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@school.edu.in"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="password" className={labelCls}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className={cn(inputCls, "pr-11")}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 transition hover:text-ink-600"
                >
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {state?.error && (
              <p
                role="alert"
                className="rounded-xl bg-rose-50 px-3.5 py-3 text-[13.5px] font-bold text-rose-600 ring-1 ring-rose-600/20"
              >
                {state.error}
              </p>
            )}

            <button type="submit" disabled={pending} className={cn(btnPrimary, "w-full py-3")}>
              {pending ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Sign in <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-ink-400">
              One-tap demo login
            </span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {DEMO.map((d) => (
              <button
                key={d.email}
                type="button"
                onClick={() => quickFill(d.email)}
                className={cn(
                  "group rounded-2xl border border-line bg-card p-3.5 text-left transition hover:border-brand-300 hover:shadow-card",
                  filling === d.email && "border-brand-400 ring-4 ring-brand-500/10"
                )}
              >
                <span className="flex items-center gap-2 text-[13px] font-extrabold text-ink-900">
                  <span className="text-brand-600">{d.icon}</span>
                  {d.role}
                  <ArrowRight
                    size={13}
                    className="ml-auto text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600"
                  />
                </span>
                <span className="mt-1 block text-[11.5px] text-ink-500">{d.desc}</span>
              </button>
            ))}
          </div>

          <p className="mt-5 rounded-xl bg-brand-50 px-3.5 py-2.5 text-center text-[12.5px] font-semibold text-brand-700">
            Demo password for all accounts: <strong>demo123</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
