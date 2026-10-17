import type { ReactNode } from "react";
import { avatarColor, cn, initials, pct } from "@/lib/utils";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("card", className)}>{children}</div>;
}

export function CardHeader({
  title,
  sub,
  action,
  className,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-6 pt-5", className)}>
      <div>
        <h3 className="font-display text-[15px] font-bold tracking-tight text-ink-900">
          {title}
        </h3>
        {sub && <p className="mt-0.5 text-[13px] text-ink-500">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900 sm:text-[28px]">
          {title}
        </h1>
        {sub && <p className="mt-1 text-sm text-ink-500">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

type Tone = "brand" | "success" | "warning" | "danger" | "neutral" | "info";

const TONES: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700 ring-brand-600/15",
  success: "bg-mint-500/10 text-mint-600 ring-mint-600/15",
  warning: "bg-accent-500/10 text-accent-600 ring-accent-600/15",
  danger: "bg-rose-500/10 text-rose-600 ring-rose-600/15",
  info: "bg-sky-500/10 text-sky-500 ring-sky-500/15",
  neutral: "bg-ink-100 text-ink-600 ring-ink-500/10",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ring-1 ring-inset",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Avatar({
  name,
  className,
  size = "md",
}: {
  name: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizes = {
    sm: "h-8 w-8 text-[11px]",
    md: "h-10 w-10 text-xs",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-xl",
  };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold ring-1 ring-inset ring-black/5",
        avatarColor(name),
        sizes[size],
        className
      )}
    >
      {initials(name)}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "brand",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
}) {
  const iconTones: Record<Tone, string> = {
    brand: "bg-brand-50 text-brand-600",
    success: "bg-mint-500/10 text-mint-600",
    warning: "bg-accent-500/10 text-accent-600",
    danger: "bg-rose-500/10 text-rose-600",
    info: "bg-sky-500/10 text-sky-500",
    neutral: "bg-ink-100 text-ink-600",
  };
  return (
    <Card className="p-5 transition hover:-translate-y-0.5 hover:shadow-pop/50">
      <div className="flex items-center justify-between">
        <p className="text-[12.5px] font-semibold uppercase tracking-wide text-ink-500">
          {label}
        </p>
        {icon && (
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              iconTones[tone]
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink-900">
        {value}
      </p>
      {hint && <p className="mt-1 text-[13px] text-ink-500">{hint}</p>}
    </Card>
  );
}

export function Progress({
  value,
  className,
  tone,
}: {
  value: number;
  className?: string;
  tone?: "auto" | "brand";
}) {
  const v = Math.max(0, Math.min(100, value));
  const bar =
    tone === "brand"
      ? "bg-brand-600"
      : v >= 75
        ? "bg-mint-500"
        : v >= 50
          ? "bg-accent-500"
          : "bg-rose-500";
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-ink-100", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-700", bar)}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

export function Delta({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[12.5px] font-bold",
        up ? "text-mint-600" : "text-rose-600"
      )}
    >
      <span aria-hidden>{up ? "▲" : "▼"}</span>
      {Math.abs(Math.round(value))} pts
    </span>
  );
}

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_30px_-12px_rgba(79,70,229,.7)] transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50";

export const btnOutline =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-bold text-ink-700 transition hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-ink-600 transition hover:bg-ink-100 hover:text-ink-900";

export const inputCls =
  "w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10";

export const labelCls = "mb-1.5 block text-[12.5px] font-bold text-ink-600";

export function Button({
  type = "button",
  variant = "primary",
  className = "",
  children,
}: {
  type?: "button" | "submit";
  variant?: "primary" | "outline" | "ghost";
  className?: string;
  children: ReactNode;
}) {
  const base = variant === "primary" ? btnPrimary : variant === "outline" ? btnOutline : btnGhost;
  return (
    <button type={type} className={`${base} ${className}`}>
      {children}
    </button>
  );
}

export function Field({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

export function EmptyState({
  title,
  hint,
  icon,
}: {
  title: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">
        {icon ?? "—"}
      </div>
      <p className="font-display text-sm font-bold text-ink-700">{title}</p>
      {hint && <p className="mt-1 max-w-xs text-[13px] text-ink-500">{hint}</p>}
    </div>
  );
}

export function ScoreRing({
  value,
  size = 116,
  label = "score",
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  const r = 52;
  const c = 2 * Math.PI * r;
  const color = v >= 75 ? "#10b981" : v >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#f1f5f9" strokeWidth="12" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * v) / 100}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-extrabold text-ink-900">
          {pct(v)}
        </span>
        <span className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">
          {label}
        </span>
      </div>
    </div>
  );
}
