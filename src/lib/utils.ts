import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const AVATAR_COLORS = [
  "bg-brand-100 text-brand-700",
  "bg-accent-100 text-accent-600",
  "bg-mint-500/15 text-mint-600",
  "bg-sky-500/15 text-sky-500",
  "bg-rose-500/15 text-rose-600",
  "bg-violet-500/15 text-violet-600",
];

export function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function fmtDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function fmtDay(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function pct(n: number) {
  return `${Math.round(n)}%`;
}

export function toneForPct(n: number) {
  if (n >= 75) return "text-mint-600";
  if (n >= 50) return "text-accent-600";
  return "text-rose-600";
}

export function todayIST() {
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  return now;
}

export function weekMonday(from: Date = new Date()) {
  const day = (from.getDay() + 6) % 7;
  return new Date(from.getFullYear(), from.getMonth(), from.getDate() - day);
}
