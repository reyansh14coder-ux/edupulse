"use client";

import { useMemo, useState, useTransition } from "react";
import { ClipboardList, Loader2, Save } from "lucide-react";
import { saveScoresAction } from "@/app/actions/marks";
import { Avatar, Badge, btnPrimary, btnOutline, inputCls, labelCls } from "@/components/ui";
import { cn, isoDate } from "@/lib/utils";

type ClassOpt = { id: string; label: string; subjects: string[]; students: { id: string; name: string; roll: number }[] };
type Assmt = { id: string; classId: string; subject: string; title: string; type: string; maxMarks: number; date: string };
type ScoreMap = Record<string, Record<string, number>>;

export function MarksEntry({
  classes,
  assessments,
  scoreMap,
}: {
  classes: ClassOpt[];
  assessments: Assmt[];
  scoreMap: ScoreMap;
}) {
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [subject, setSubject] = useState(classes[0]?.subjects[0] ?? "");
  const [assessmentId, setAssessmentId] = useState<string>("__new");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("UNIT_TEST");
  const [maxMarks, setMaxMarks] = useState(25);
  const [date, setDate] = useState(isoDate(new Date()));
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const currentClass = classes.find((c) => c.id === classId);
  const classAssessments = useMemo(
    () => assessments.filter((a) => a.classId === classId && a.subject === subject),
    [assessments, classId, subject]
  );

  const selectAssessment = (id: string) => {
    setAssessmentId(id);
    setMsg(null);
    if (id === "__new") {
      setTitle("");
      setMaxMarks(25);
      setDate(isoDate(new Date()));
      setMarks({});
      return;
    }
    const a = classAssessments.find((x) => x.id === id);
    if (!a) return;
    setTitle(a.title);
    setType(a.type);
    setMaxMarks(a.maxMarks);
    setDate(a.date);
    const existing = scoreMap[a.id] ?? {};
    setMarks(
      Object.fromEntries(
        (currentClass?.students ?? []).map((s) => [
          s.id,
          existing[s.id] !== undefined ? String(existing[s.id]) : "",
        ])
      )
    );
  };

  const save = () => {
    setMsg(null);
    const entries = (currentClass?.students ?? [])
      .map((s) => ({ studentId: s.id, raw: (marks[s.id] ?? "").trim() }))
      .filter((e) => e.raw !== "")
      .map((e) => ({ studentId: e.studentId, marks: Number(e.raw) }));

    if (!entries.length) {
      setMsg({ ok: false, text: "Enter marks for at least one student." });
      return;
    }
    if (!title.trim() && assessmentId === "__new") {
      setMsg({ ok: false, text: "Give the new assessment a title." });
      return;
    }
    for (const e of entries) {
      if (Number.isNaN(e.marks) || e.marks < 0 || e.marks > maxMarks) {
        setMsg({ ok: false, text: `Marks must be between 0 and ${maxMarks}.` });
        return;
      }
    }

    startTransition(async () => {
      try {
        await saveScoresAction({
          classId,
          subject,
          assessmentId: assessmentId === "__new" ? undefined : assessmentId,
          meta: { title: title.trim() || "Assessment", type, maxMarks, date },
          scores: entries,
        });
        setMsg({
          ok: true,
          text: `${entries.length} result(s) saved — trends and insights updated.`,
        });
      } catch (e) {
        setMsg({ ok: false, text: e instanceof Error ? e.message : "Failed to save." });
      }
    });
  };

  if (!currentClass) return null;

  return (
    <div>
      <div className="grid gap-3 border-b border-line p-5 md:grid-cols-4">
        <div>
          <label className={labelCls}>Class</label>
          <select
            className={inputCls}
            value={classId}
            onChange={(e) => {
              const c = classes.find((x) => x.id === e.target.value);
              setClassId(e.target.value);
              setSubject(c?.subjects[0] ?? "");
              setAssessmentId("__new");
              setMarks({});
              setMsg(null);
            }}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Subject</label>
          <select
            className={inputCls}
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setAssessmentId("__new");
              setMarks({});
              setMsg(null);
            }}
          >
            {currentClass.subjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>Assessment</label>
          <select
            className={inputCls}
            value={assessmentId}
            onChange={(e) => selectAssessment(e.target.value)}
          >
            <option value="__new">＋ New assessment…</option>
            {classAssessments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title} · {new Date(a.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 border-b border-line bg-surface/50 p-5 md:grid-cols-4">
        <div className="md:col-span-2">
          <label className={labelCls}>Title</label>
          <input
            className={inputCls}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={assessmentId === "__new" ? "e.g. Unit Test 3 – Algebra" : "Assessment title"}
            disabled={assessmentId !== "__new"}
          />
        </div>
        <div>
          <label className={labelCls}>Type</label>
          <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)} disabled={assessmentId !== "__new"}>
            <option value="UNIT_TEST">Unit Test</option>
            <option value="MONTHLY_TEST">Monthly Test</option>
            <option value="EXAM">Exam</option>
            <option value="QUIZ">Quiz</option>
            <option value="HOMEWORK">Homework review</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Max marks</label>
            <input
              type="number"
              min={1}
              className={inputCls}
              value={maxMarks}
              onChange={(e) => setMaxMarks(Number(e.target.value))}
            />
          </div>
          <div>
            <label className={labelCls}>Date</label>
            <input
              type="date"
              className={inputCls}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={assessmentId !== "__new"}
            />
          </div>
        </div>
      </div>

      {msg && (
        <p
          className={cn(
            "px-5 py-2.5 text-[13px] font-bold",
            msg.ok ? "bg-mint-500/10 text-mint-600" : "bg-rose-50 text-rose-600"
          )}
        >
          {msg.text}
        </p>
      )}

      <ul className="divide-y divide-line">
        {currentClass.students.map((s) => {
          const filled = (marks[s.id] ?? "").trim() !== "";
          const invalid =
            filled &&
            (Number.isNaN(Number(marks[s.id])) ||
              Number(marks[s.id]) < 0 ||
              Number(marks[s.id]) > maxMarks);
          return (
            <li
              key={s.id}
              className="flex items-center justify-between gap-4 px-5 py-2.5 transition hover:bg-surface/60"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-center text-[12.5px] font-bold text-ink-400">
                  {s.roll}
                </span>
                <Avatar name={s.name} size="sm" />
                <span className="text-[14px] font-bold text-ink-900">{s.name}</span>
                {filled && !invalid && (
                  <Badge tone="success">{Math.round((Number(marks[s.id]) / maxMarks) * 100)}%</Badge>
                )}
                {invalid && <Badge tone="danger">invalid</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={maxMarks}
                  value={marks[s.id] ?? ""}
                  onChange={(e) => {
                    setMsg(null);
                    setMarks((prev) => ({ ...prev, [s.id]: e.target.value }));
                  }}
                  placeholder="—"
                  className={cn(
                    inputCls,
                    "w-24 text-center font-bold",
                    invalid && "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
                  )}
                />
                <span className="w-14 text-[12.5px] text-ink-400">/ {maxMarks}</span>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4">
        <p className="text-[12.5px] text-ink-500">
          <ClipboardList size={13} className="mr-1 inline" />
          Blank rows are skipped. Quiz results are also recorded here automatically.
        </p>
        <button type="button" className={btnPrimary} onClick={save} disabled={pending}>
          {pending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {pending ? "Saving…" : "Save results"}
        </button>
      </div>
    </div>
  );
}
