"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { submitQuizAttemptAction } from "@/app/actions/quiz";
import { btnPrimary } from "@/components/ui";
import { cn } from "@/lib/utils";

export type PlayerQuestion = {
  chapter: string;
  q: string;
  options: string[];
  answer: number;
};

export function QuizPlayer({
  quizId,
  questions,
}: {
  quizId: string;
  questions: PlayerQuestion[];
}) {
  const [answers, setAnswers] = useState<(number | null)[]>(
    () => questions.map(() => null)
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const answered = answers.filter((a) => a !== null).length;

  const submit = () => {
    if (answers.some((a) => a === null)) {
      setError("Please answer every question before submitting.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await submitQuizAttemptAction(
          quizId,
          answers.map((a) => a ?? 0)
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not submit quiz.");
      }
    });
  };

  return (
    <div>
      <ul className="divide-y divide-line">
        {questions.map((q, qi) => (
          <li key={qi} className="p-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-[12px] font-extrabold text-brand-700">
                {qi + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold leading-relaxed text-ink-900">
                  {q.q}
                </p>
                <p className="mt-0.5 text-[11.5px] font-semibold uppercase tracking-wide text-ink-400">
                  {q.chapter}
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {q.options.map((opt, oi) => {
                    const selected = answers[qi] === oi;
                    return (
                      <button
                        key={oi}
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          setAnswers((prev) => {
                            const next = [...prev];
                            next[qi] = oi;
                            return next;
                          })
                        }
                        className={cn(
                          "flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-[13.5px] font-semibold transition",
                          selected
                            ? "border-brand-500 bg-brand-50 text-brand-800 ring-4 ring-brand-500/10"
                            : "border-line bg-card text-ink-700 hover:border-brand-300 hover:bg-brand-50/40"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-4.5 w-4.5 h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border text-[10px] font-extrabold",
                            selected
                              ? "border-brand-600 bg-brand-600 text-white"
                              : "border-ink-300 text-transparent"
                          )}
                        >
                          ●
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {error && (
        <p className="border-t border-line bg-rose-50 px-5 py-2.5 text-[13px] font-bold text-rose-600">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
        <p className="text-[13px] text-ink-500">
          {answered} of {questions.length} answered
        </p>
        <button type="button" onClick={submit} disabled={pending} className={btnPrimary}>
          {pending ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Submitting…
            </>
          ) : (
            <>Submit quiz</>
          )}
        </button>
      </div>
    </div>
  );
}

export function QuizResult({
  questions,
  detail,
  score,
}: {
  questions: PlayerQuestion[];
  detail: { picked: number; correct: boolean }[];
  score: number;
}) {
  const pctScore = Math.round((score / questions.length) * 100);
  return (
    <div>
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-4 border-b px-5 py-5",
          pctScore >= 60 ? "bg-mint-500/5" : "bg-rose-500/5"
        )}
      >
        <div className="flex items-center gap-3">
          {pctScore >= 60 ? (
            <CheckCircle2 className="text-mint-600" size={34} />
          ) : (
            <XCircle className="text-rose-600" size={34} />
          )}
          <div>
            <p className="font-display text-xl font-extrabold text-ink-900">
              {score} / {questions.length} correct ({pctScore}%)
            </p>
            <p className="text-[13px] text-ink-500">
              This result has been added to your progress history and insights
              have been re-analyzed.
            </p>
          </div>
        </div>
      </div>
      <ul className="divide-y divide-line">
        {questions.map((q, i) => {
          const d = detail[i];
          const ok = d?.correct;
          return (
            <li key={i} className="p-5">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-extrabold",
                    ok ? "bg-mint-500/15 text-mint-600" : "bg-rose-500/15 text-rose-600"
                  )}
                >
                  {ok ? "✓" : "✕"}
                </span>
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-ink-900">{q.q}</p>
                  <p className="mt-1 text-[13.5px] text-ink-600">
                    Your answer:{" "}
                    <span className={ok ? "font-bold text-mint-600" : "font-bold text-rose-600"}>
                      {q.options[d?.picked ?? 0] ?? "—"}
                    </span>
                    {!ok && (
                      <>
                        {" · Correct: "}
                        <span className="font-bold text-mint-600">
                          {q.options[q.answer]}
                        </span>
                      </>
                    )}
                  </p>
                  <p className="mt-0.5 text-[11.5px] font-semibold uppercase tracking-wide text-ink-400">
                    {q.chapter}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
