"use client";

import { useState, useTransition } from "react";
import {
  ChevronDown,
  ListChecks,
  Loader2,
  Play,
  RotateCcw,
  SearchCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { diveDeeperAction } from "@/app/actions/insights";
import type { DeepDive } from "@/lib/deep-dive";

type Props = {
  subject: string;
  summary: string;
  avg: number | null;
  count: number;
  trend: number;
  weak: { chapter: string; pct: number }[];
  labels?: DiveLabels;
};

export type DiveLabels = {
  btn: string;
  up: string;
  down: string;
  flat: string;
  tests: (n: number) => string;
  focus: string;
  loading: (subject: string) => string;
  error: string;
  retry: string;
};

const EN_LABELS: DiveLabels = {
  btn: "Dive deeper",
  up: "improving",
  down: "recover soon",
  flat: "steady",
  tests: (n) => `${n} test${n === 1 ? "" : "s"}`,
  focus: "Next focus",
  loading: (subject) => `Analysing your ${subject} data…`,
  error:
    "Analysis could not be loaded right now. Your gap list above still works.",
  retry: "Try again",
};

export function SubjectDive({
  subject,
  summary,
  avg,
  count,
  trend,
  weak,
  labels,
}: Props) {
  const L = { ...EN_LABELS, ...labels };
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<DeepDive | null>(null);
  const [tried, setTried] = useState(false);
  const [pending, startTransition] = useTransition();

  const load = () => {
    setTried(true);
    setData(null);
    startTransition(async () => {
      setData(await diveDeeperAction(subject));
    });
  };

  const onToggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (!tried) load();
  };

  const trendUp = trend > 3;
  const trendDown = trend < -3;

  return (
    <div className="rounded-2xl border border-line bg-surface/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="font-display text-[14.5px] font-extrabold text-ink-900">{subject}</p>
          {avg !== null ? (
            <span className="rounded-lg bg-ink-900 px-2 py-0.5 text-[12px] font-extrabold text-white">
              {Math.round(avg)}%
            </span>
          ) : (
            <span className="rounded-lg border border-dashed border-line px-2 py-0.5 text-[11.5px] font-bold text-ink-400">
              no scores yet
            </span>
          )}
          {avg !== null && (
            <span
              className={`inline-flex items-center gap-1 text-[12px] font-bold ${
                trendUp ? "text-mint-600" : trendDown ? "text-rose-500" : "text-ink-400"
              }`}
            >
              {trendUp ? (
                <TrendingUp size={13} />
              ) : trendDown ? (
                <TrendingDown size={13} />
              ) : (
                <span className="h-1 w-4 rounded-full bg-ink-300" />
              )}
              {trendUp ? L.up : trendDown ? L.down : L.flat}
              {count > 0 && (
                <span className="font-medium text-ink-400">
                  · {L.tests(count)}
                </span>
              )}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-[12.5px] font-bold text-brand-700 transition hover:bg-brand-100"
        >
          <Sparkles size={13} /> {L.btn}
          <ChevronDown size={13} className={open ? "rotate-180 transition" : "transition"} />
        </button>
      </div>

      <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-500">{summary}</p>

      {weak.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {weak.slice(0, 3).map((w) => (
            <span
              key={w.chapter}
              className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11.5px] font-bold text-amber-700"
            >
              {L.focus} · {w.chapter}
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="mt-3 border-t border-line pt-3">
          {pending && !data && (
            <div className="space-y-2.5" aria-busy>
              {[72, 94, 84].map((w, i) => (
                <div key={i} className="h-3.5 animate-pulse rounded-full bg-ink-100" style={{ width: `${w}%` }} />
              ))}
              <p className="pt-1 text-[12px] font-semibold text-ink-400">
                <Loader2 size={12} className="mr-1 inline animate-spin" />{" "}
                {L.loading(subject)}
              </p>
            </div>
          )}

          {!pending && !data && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-line px-3.5 py-3">
              <p className="text-[12.5px] text-ink-500">{L.error}</p>
              <button
                type="button"
                onClick={load}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 py-1.5 text-[12px] font-bold text-brand-600 hover:border-brand-300"
              >
                <RotateCcw size={12} /> {L.retry}
              </button>
            </div>
          )}

          {data && <DivePanel data={data} />}
        </div>
      )}
    </div>
  );
}

function Section({
  icon,
  title,
  tone,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  tone: "sky" | "amber" | "violet" | "mint";
  children: React.ReactNode;
}) {
  const tones = {
    sky: "border-sky-200 bg-sky-50/60 text-sky-700",
    amber: "border-amber-200 bg-amber-50/60 text-amber-700",
    violet: "border-violet-200 bg-violet-50/60 text-violet-700",
    mint: "border-mint-200 bg-mint-500/5 text-mint-700",
  } as const;
  return (
    <div className={`rounded-xl border p-3.5 ${tones[tone]}`}>
      <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wider">
        {icon} {title}
      </p>
      <div className="mt-1.5 text-ink-700">{children}</div>
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink-700">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-40" />
          {t}
        </li>
      ))}
    </ul>
  );
}

function DivePanel({ data }: { data: DeepDive }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2.5 rounded-xl border border-brand-200 bg-brand-50/60 p-3.5">
        <Sparkles size={15} className="mt-0.5 shrink-0 text-brand-600" />
        <div>
          <p className="text-[13.5px] font-bold leading-relaxed text-ink-800">{data.summary}</p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-brand-500">
            {data.source === "ai" ? "✨ AI analysis" : "Quick analysis from your data"}
          </p>
        </div>
      </div>

      <Section icon={<SearchCheck size={13} />} title="What the data shows" tone="sky">
        <Bullets items={data.reasons} />
      </Section>

      <Section icon={<Target size={13} />} title="What to practise" tone="amber">
        <Bullets items={data.practice} />
      </Section>

      <Section icon={<ListChecks size={13} />} title="Your improvement steps" tone="violet">
        <ol className="space-y-1.5">
          {data.steps.map((t, i) => (
            <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink-700">
              <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-[10.5px] font-extrabold text-violet-600">
                {i + 1}
              </span>
              {t}
            </li>
          ))}
        </ol>
      </Section>

      {data.videos.length > 0 && (
        <Section icon={<Play size={13} />} title="Watch & learn" tone="mint">
          <ul className="space-y-1.5">
            {data.videos.map((v, i) => (
              <li key={i}>
                <a
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-600 hover:underline"
                >
                  <Play size={12} className="shrink-0" /> {v.title}
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
