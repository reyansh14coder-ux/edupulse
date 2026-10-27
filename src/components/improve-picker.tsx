"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Lightbulb,
  Play,
  Sparkles,
  Target,
  XCircle,
} from "lucide-react";
import { practiceForChapterAction } from "@/app/actions/quiz";
import { Badge, EmptyState } from "@/components/ui";

export type ImproveTopic = {
  chapter: string;
  severity: "weak" | "review" | "strong" | "new";
  pct: number | null;
  correct: number;
  total: number;
  wrong: { q: string; yourAnswer: string; correctAnswer: string }[];
  rec: string;
  plan: { tricks: string[]; practice: string[]; video: { title: string; url: string } };
};

export type ImproveSubject = { subject: string; topics: ImproveTopic[] };

const SEVERITY_TONE = {
  weak: "danger",
  review: "warning",
  new: "brand",
  strong: "success",
} as const;

const SEVERITY_LABEL = {
  weak: "Focus",
  review: "Review",
  new: "New",
  strong: "Strong",
} as const;

export function ImprovePicker({
  subjects,
  defaultSubject,
}: {
  subjects: ImproveSubject[];
  defaultSubject: string;
}) {
  const initial =
    subjects.find((s) => s.subject === defaultSubject) ?? subjects[0] ?? null;
  const [subjectName, setSubjectName] = useState(initial?.subject ?? "");
  const [chapterName, setChapterName] = useState(initial?.topics[0]?.chapter ?? "");

  const block =
    subjects.find((s) => s.subject === subjectName) ?? initial ?? null;
  const topic =
    block?.topics.find((t) => t.chapter === chapterName) ?? block?.topics[0] ?? null;

  if (!block || !topic) {
    return (
      <EmptyState
        title="Topics will appear here"
        hint="Once the syllabus loads, pick any subject and topic to see improvement tips."
        icon={<Sparkles size={20} />}
      />
    );
  }

  const selectCls =
    "w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-[13.5px] font-bold text-ink-800 outline-none transition focus:border-brand-400";

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-wider text-ink-400">
            Subject
          </span>
          <select
            className={selectCls}
            value={subjectName}
            onChange={(e) => {
              const next = e.target.value;
              setSubjectName(next);
              const first = subjects.find((s) => s.subject === next)?.topics[0];
              setChapterName(first?.chapter ?? "");
            }}
          >
            {subjects.map((s) => (
              <option key={s.subject} value={s.subject}>
                {s.subject} · {s.topics.length} topics
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-wider text-ink-400">
            Topic
          </span>
          <select
            className={selectCls}
            value={topic.chapter}
            onChange={(e) => setChapterName(e.target.value)}
          >
            {block.topics.map((t) => (
              <option key={t.chapter} value={t.chapter}>
                {t.chapter}
                {t.pct !== null ? ` · ${Math.round(t.pct)}%` : " · new"}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-2xl border border-line bg-surface/60 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={SEVERITY_TONE[topic.severity]}>
            {SEVERITY_LABEL[topic.severity]}
          </Badge>
          <p className="font-display text-[14.5px] font-extrabold text-ink-900">
            {block.subject} — {topic.chapter}
          </p>
          {topic.pct !== null && (
            <span className="text-[12px] font-bold text-ink-500">
              {Math.round(topic.pct)}% accuracy ({topic.correct}/{topic.total})
            </span>
          )}
        </div>

        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-700">{topic.rec}</p>

        {topic.wrong.length > 0 && (
          <div className="mt-3">
            <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wider text-rose-500">
              <XCircle size={12} /> Questions you got wrong
            </p>
            <ul className="mt-1.5 space-y-2">
              {topic.wrong.map((w, j) => (
                <li
                  key={j}
                  className="rounded-xl border border-rose-100 bg-rose-50/50 px-3.5 py-2.5"
                >
                  <p className="text-[13px] font-semibold text-ink-800">
                    {j + 1}. {w.q}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-x-4 text-[12.5px] text-ink-600">
                    <span className="text-rose-600">Your answer: {w.yourAnswer}</span>
                    <span className="font-semibold text-mint-600">
                      Correct: {w.correctAnswer}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-3.5">
            <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wider text-violet-600">
              <Lightbulb size={12} /> Tricks to solve
            </p>
            <ul className="mt-1.5 space-y-1.5">
              {topic.plan.tricks.map((t, j) => (
                <li key={j} className="flex gap-2 text-[13px] leading-relaxed text-ink-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-3.5">
            <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wider text-brand-600">
              <Target size={12} /> Practice these question types
            </p>
            <ul className="mt-1.5 space-y-1.5">
              {topic.plan.practice.map((t, j) => (
                <li key={j} className="flex gap-2 text-[13px] leading-relaxed text-ink-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <form action={practiceForChapterAction}>
            <input type="hidden" name="subject" value={block.subject} />
            <input type="hidden" name="chapter" value={topic.chapter} />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-[12.5px] font-bold text-brand-700 transition hover:bg-brand-100"
            >
              <Sparkles size={13} /> Start practice quiz
            </button>
          </form>
          <a
            href={topic.plan.video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-2 text-[12.5px] font-bold text-brand-600 transition hover:border-brand-300 hover:bg-brand-50"
          >
            <Play size={13} /> Watch explanation video
          </a>
          <span className="text-[12px] text-ink-400">{topic.plan.video.title}</span>
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-[12.5px] text-ink-500">
        <CheckCircle2 size={13} className="shrink-0 text-mint-500" />
        Every quiz you attempt updates your accuracy here automatically.
      </p>
    </div>
  );
}
