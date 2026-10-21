"use client";

import { useTransition } from "react";
import { Check, Plus, RotateCcw, ThumbsUp, Clock3 } from "lucide-react";
import {
  createInterventionAction,
  setInterventionOutcomeAction,
  setInterventionStatusAction,
} from "@/app/actions/intervention";

type Item = {
  id: string;
  title: string;
  note: string | null;
  status: string;
  outcome: string | null;
  createdByName: string;
  createdAt: string;
};

export function InterventionPanel({
  studentId,
  items,
  canEdit,
}: {
  studentId: string;
  items: Item[];
  canEdit: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div>
      {canEdit && (
        <form
          action={(fd) =>
            startTransition(async () => {
              await createInterventionAction(fd);
            })
          }
          className="mb-4 space-y-2 border-b border-line px-5 pb-4"
        >
          <input type="hidden" name="studentId" value={studentId} />
          <input
            name="title"
            required
            maxLength={160}
            placeholder="Support step (e.g. 10-min daily reading check-in)"
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-[13px] text-ink-800 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          <input
            name="note"
            maxLength={500}
            placeholder="Notes for yourself (optional)"
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-[13px] text-ink-800 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-1.5 text-[12.5px] font-bold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            <Plus size={13} /> {pending ? "Saving..." : "Log support step"}
          </button>
        </form>
      )}

      <ul className="divide-y divide-line">
        {items.map((it) => (
          <li key={it.id} className="px-5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13.5px] font-bold text-ink-900">{it.title}</p>
              <BadgeLike
                tone={it.status === "DONE" ? "success" : "info"}
                label={it.status === "DONE" ? "done" : "active"}
              />
            </div>
            {it.note && <p className="mt-0.5 text-[12.5px] text-ink-600">{it.note}</p>}
            <p className="mt-0.5 text-[11.5px] text-ink-400">
              {it.createdByName} · {it.createdAt}
              {it.outcome && ` · ${it.outcome === "HELPED" ? "reported helping ✓" : "needs a different approach"}`}
            </p>
            {canEdit && (
              <div className="mt-2 flex flex-wrap gap-2">
                {it.status !== "DONE" ? (
                  <MiniBtn
                    onClick={() => startTransition(() => setInterventionStatusAction(it.id, "DONE"))}
                    disabled={pending}
                  >
                    <Check size={12} /> Mark done
                  </MiniBtn>
                ) : (
                  <MiniBtn
                    onClick={() => startTransition(() => setInterventionStatusAction(it.id, "ACTIVE"))}
                    disabled={pending}
                  >
                    <RotateCcw size={12} /> Reopen
                  </MiniBtn>
                )}
                {!it.outcome && (
                  <>
                    <MiniBtn
                      tone="success"
                      onClick={() =>
                        startTransition(() => setInterventionOutcomeAction(it.id, "HELPED"))
                      }
                      disabled={pending}
                    >
                      <ThumbsUp size={12} /> Did it help?
                    </MiniBtn>
                    <MiniBtn
                      tone="warn"
                      onClick={() =>
                        startTransition(() => setInterventionOutcomeAction(it.id, "NOT_YET"))
                      }
                      disabled={pending}
                    >
                      <Clock3 size={12} /> Not yet
                    </MiniBtn>
                  </>
                )}
              </div>
            )}
          </li>
        ))}
        {!items.length && (
          <li className="px-5 py-6 text-center text-[13px] text-ink-500">
            No support steps logged yet — record one when you start helping.
          </li>
        )}
      </ul>
    </div>
  );
}

function BadgeLike({ tone, label }: { tone: string; label: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
        tone === "success"
          ? "bg-mint-100 text-mint-700"
          : "bg-brand-100 text-brand-700"
      }`}
    >
      {label}
    </span>
  );
}

function MiniBtn({
  children,
  onClick,
  disabled,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "success" | "warn";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11.5px] font-bold transition disabled:opacity-50 ${
        tone === "success"
          ? "border-mint-300 bg-mint-50 text-mint-700 hover:bg-mint-100"
          : tone === "warn"
            ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
            : "border-line bg-card text-ink-600 hover:border-brand-300 hover:text-brand-700"
      }`}
    >
      {children}
    </button>
  );
}
