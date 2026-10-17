"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCheck, Loader2, Save } from "lucide-react";
import { saveAttendanceAction } from "@/app/actions/attendance";
import { Avatar, Badge, btnPrimary, btnOutline } from "@/components/ui";
import { cn } from "@/lib/utils";

type StudentRow = { id: string; name: string; roll: number; status: string | null };

const OPTIONS = [
  { value: "PRESENT", label: "Present", active: "bg-mint-500 text-white border-mint-500" },
  { value: "ABSENT", label: "Absent", active: "bg-rose-500 text-white border-rose-500" },
  { value: "LATE", label: "Late", active: "bg-accent-500 text-white border-accent-500" },
];

export function AttendanceMarking({
  classId,
  date,
  students,
}: {
  classId: string;
  date: string;
  students: StudentRow[];
}) {
  const [statuses, setStatuses] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      students.map((s) => [s.id, s.status ?? "PRESENT"])
    )
  );
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const vals = Object.values(statuses);
    return {
      present: vals.filter((v) => v === "PRESENT").length,
      absent: vals.filter((v) => v === "ABSENT").length,
      late: vals.filter((v) => v === "LATE").length,
    };
  }, [statuses]);

  const markAll = (value: string) => {
    setDone(false);
    setStatuses(Object.fromEntries(students.map((s) => [s.id, value])));
  };

  const save = () => {
    setError(null);
    setDone(false);
    startTransition(async () => {
      try {
        await saveAttendanceAction({
          classId,
          date,
          entries: Object.entries(statuses).map(([studentId, status]) => ({
            studentId,
            status,
          })),
        });
        setDone(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save attendance.");
      }
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex items-center gap-2">
          <Badge tone="success">{stats.present} present</Badge>
          <Badge tone="danger">{stats.absent} absent</Badge>
          <Badge tone="warning">{stats.late} late</Badge>
        </div>
        <div className="flex gap-2">
          <button type="button" className={btnOutline} onClick={() => markAll("PRESENT")}>
            <CheckCheck size={15} /> All present
          </button>
          <button type="button" className={btnPrimary} onClick={save} disabled={pending}>
            {pending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {pending ? "Saving…" : "Save attendance"}
          </button>
        </div>
      </div>

      {(done || error) && (
        <p
          className={cn(
            "px-5 py-2.5 text-[13px] font-bold",
            error ? "bg-rose-50 text-rose-600" : "bg-mint-500/10 text-mint-600"
          )}
        >
          {error ?? "Attendance saved. It's now part of every student's progress history."}
        </p>
      )}

      <ul className="divide-y divide-line">
        {students.map((s) => {
          const current = statuses[s.id];
          return (
            <li
              key={s.id}
              className="flex items-center justify-between gap-4 px-5 py-3 transition hover:bg-surface/60"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-center text-[12.5px] font-bold text-ink-400">
                  {s.roll}
                </span>
                <Avatar name={s.name} size="sm" />
                <span className="text-[14px] font-bold text-ink-900">{s.name}</span>
              </div>
              <div className="flex gap-1.5">
                {OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      setDone(false);
                      setStatuses((prev) => ({ ...prev, [s.id]: o.value }));
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-[12.5px] font-bold transition",
                      current === o.value
                        ? o.active
                        : "border-line bg-card text-ink-500 hover:border-ink-300"
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
