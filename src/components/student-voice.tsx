"use client";

import { useState, useTransition } from "react";
import { Smile, Meh, Frown, Send } from "lucide-react";
import { saveVoiceAction } from "@/app/actions/voice";

const MOODS = [
  { key: "GREAT", label: "Doing great", icon: Smile, cls: "border-mint-300 bg-mint-50 text-mint-700" },
  { key: "OK", label: "It's okay", icon: Meh, cls: "border-amber-300 bg-amber-50 text-amber-700" },
  { key: "TOUGH", label: "Struggling today", icon: Frown, cls: "border-rose-300 bg-rose-50 text-rose-700" },
];

export function StudentVoiceCard() {
  const [mood, setMood] = useState<string>("GREAT");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <form
      action={(fd) => {
        fd.set("mood", mood);
        startTransition(async () => {
          await saveVoiceAction(fd);
          setNote("");
          setSaved(true);
          setTimeout(() => setSaved(false), 4000);
        });
      }}
      className="rounded-2xl border border-line bg-gradient-to-br from-violet-50/70 via-white to-white p-4"
    >
      <p className="font-display text-[14.5px] font-extrabold text-ink-900">
        How are you feeling today?
      </p>
      <p className="mt-0.5 text-[12px] text-ink-500">
        Your answer helps your teachers support you better.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {MOODS.map((m) => {
          const Icon = m.icon;
          const active = mood === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setMood(m.key)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12.5px] font-bold transition ${
                active ? m.cls : "border-line bg-card text-ink-500 hover:border-ink-300"
              }`}
            >
              <Icon size={14} /> {m.label}
            </button>
          );
        })}
      </div>

      <textarea
        name="note"
        rows={2}
        value={note}
        maxLength={600}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Anything you'd like your teacher to know? (optional)"
        className="mt-3 w-full resize-none rounded-xl border border-line bg-white px-3 py-2 text-[13px] text-ink-800 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[12px] font-bold text-mint-600">
          {saved ? "Saved — thank you for sharing!" : ""}
        </span>
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-1.5 rounded-xl bg-ink-900 px-3.5 py-1.5 text-[12.5px] font-bold text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          <Send size={13} /> {pending ? "Saving..." : "Share"}
        </button>
      </div>
    </form>
  );
}
