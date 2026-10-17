"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  BookOpen,
  CalendarCheck,
  ClipboardList,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  LineChart,
  Newspaper,
  Users,
  GraduationCap,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { Logo, Wordmark } from "@/components/logo";
import { logoutAction } from "@/app/actions/auth";

type Role = "ADMIN" | "TEACHER" | "PARENT" | "STUDENT";

const NAV: Record<Role, { href: string; label: string; icon: ReactNode }[]> = {
  ADMIN: [
    { href: "/admin", label: "Overview", icon: <LayoutDashboard size={18} /> },
    { href: "/admin/students", label: "Students", icon: <GraduationCap size={18} /> },
    { href: "/admin/teachers", label: "Teachers", icon: <Users size={18} /> },
    { href: "/counseling", label: "Counseling", icon: <HeartHandshake size={18} /> },
  ],
  TEACHER: [
    { href: "/teacher", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { href: "/teacher/attendance", label: "Attendance", icon: <CalendarCheck size={18} /> },
    { href: "/teacher/marks", label: "Marks", icon: <ClipboardList size={18} /> },
    { href: "/teacher/homework", label: "Homework", icon: <BookOpen size={18} /> },
    { href: "/counseling", label: "Counseling", icon: <HeartHandshake size={18} /> },
  ],
  STUDENT: [
    { href: "/student", label: "Home", icon: <LayoutDashboard size={18} /> },
    { href: "/student/homework", label: "Homework", icon: <BookOpen size={18} /> },
  ],
  PARENT: [
    { href: "/parent", label: "Overview", icon: <LayoutDashboard size={18} /> },
    { href: "/parent/report", label: "Weekly Report", icon: <Newspaper size={18} /> },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrator",
  TEACHER: "Teacher",
  PARENT: "Parent",
  STUDENT: "Student",
};

function NavLink({
  href,
  label,
  icon,
  active,
  mobile,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  mobile?: boolean;
}) {
  if (mobile) {
    return (
      <Link
        href={href}
        className={cn(
          "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold transition",
          active
            ? "bg-brand-600 text-white shadow-[0_8px_20px_-10px_rgba(79,70,229,.8)]"
            : "bg-card text-ink-600 ring-1 ring-line"
        )}
      >
        {icon}
        {label}
      </Link>
    );
  }
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold transition",
        active
          ? "bg-brand-50 text-brand-700 ring-1 ring-brand-600/10"
          : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
      )}
    >
      <span
        className={cn(
          "transition",
          active ? "text-brand-600" : "text-ink-400 group-hover:text-ink-600"
        )}
      >
        {icon}
      </span>
      {label}
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-600" />}
    </Link>
  );
}

export function AppShell({
  name,
  email,
  role,
  title,
  children,
}: {
  name: string;
  email: string;
  role: Role;
  title?: string | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const items = NAV[role];
  const isActive = (href: string) =>
    href === pathname || (href !== `/${role}` && pathname.startsWith(href + "/"));

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-line bg-card lg:flex">
        <div className="flex items-center gap-2.5 px-5 pb-5 pt-6">
          <Logo />
          <div>
            <Wordmark />
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-400">
              Student Pulse
            </p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
          {items.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              active={
                isActive(item.href) ||
                (item.href === "/admin" && pathname.startsWith("/students"))
              }
            />
          ))}
        </nav>

        <div className="m-3 rounded-2xl border border-line bg-surface p-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-[12px] font-bold text-white">
              {initials(name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-bold text-ink-900">{name}</p>
              <p className="truncate text-[11.5px] text-ink-500">
                {title || ROLE_LABEL[role]}
              </p>
            </div>
          </div>
          <form action={logoutAction} className="mt-3">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-card px-3 py-2 text-[13px] font-bold text-ink-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-[264px]">
        <header className="glass sticky top-0 z-30 border-b border-line">
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <Logo className="h-8 w-8" />
              <Wordmark />
            </div>
            <div className="hidden items-center gap-2 text-[13px] text-ink-500 lg:flex">
              <span className="font-semibold text-ink-700">{ROLE_LABEL[role]} workspace</span>
              <span className="text-ink-300">/</span>
              <span>Vidya Niketan Public School · 2026-27</span>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="hidden rounded-full bg-mint-500/10 px-3 py-1 text-[12px] font-bold text-mint-600 ring-1 ring-mint-600/15 sm:inline"
                title="Demo environment"
              >
                ● Demo data
              </span>
              <span className="truncate text-[13px] font-bold text-ink-700">{email}</span>
              <form action={logoutAction} className="lg:hidden">
                <button
                  type="submit"
                  aria-label="Sign out"
                  className="rounded-lg border border-line bg-card p-2 text-ink-500 transition hover:text-rose-600"
                >
                  <LogOut size={16} />
                </button>
              </form>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
            {items.map((item) => (
              <NavLink
                key={item.href}
                {...item}
                active={isActive(item.href)}
                mobile
              />
            ))}
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
