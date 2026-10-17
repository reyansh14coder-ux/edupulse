"use client";

import { useMemo, useState, useTransition } from "react";
import { BookOpen, Loader2, Sparkles, Wand2 } from "lucide-react";
import { createHomeworkAction } from "@/app/actions/homework";
import { createClassQuizAction, generatePracticeQuizAction } from "@/app/actions/quiz";
import { Badge, btnPrimary, inputCls, labelCls } from "@/components/ui";
import { cn } from "@/lib/utils";

type ClassOption = {
  id: string;
  label: string;
  subjects: { name: string; chapters: string[] }[];
};

export function ActivityCreateForm({ classes }: { classes: ClassOption[] }) {
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const current = classes.find((c) => c.id === classId);
  const [subject, setSubject] = useState(current?.subjects[0]?.name ?? "");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const submit = (fd: FormData) => {
    setDone(false);
    startTransition(async () => {
      await createHomeworkAction(fd);
      setDone(true);
    });
  };

  return (
    <form action={submit} className="grid gap-3.5 p-5 pt-4 sm:grid-cols-2">
      <div>
        <label className={labelCls}>Class</label>
        <select
          name="classId"
          className={inputCls}
          value={classId}
          onChange={(e) => {
            setClassId(e.target.value);
            const c = classes.find((x) => x.id === e.target.value);
            setSubject(c?.subjects[0]?.name ?? "");
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
          name="subject"
          className={inputCls}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        >
          {(current?.subjects ?? []).map((s) => (
            <option key={s.name} value={s.name}>{s.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelCls}>Activity type</label>
        <select name="kind" className={inputCls} defaultValue="HOMEWORK">
          <option value="HOMEWORK">Homework</option>
          <option value="ASSIGNMENT">Assignment</option>
          <option value="PROJECT">Project</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>Due date</label>
        <input
          type="date"
          name="dueDate"
          required
          defaultValue={new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10)}
          className={inputCls}
        />
      </div>
      <div className="sm:col-span-2">
        <label className={labelCls}>Title</label>
        <input name="title" required placeholder="e.g. Algebra practice set 3" className={inputCls} />
      </div>
      <div className="sm:col-span-2">
        <label className={labelCls}>Instructions</label>
        <textarea
          name="description"
          rows={3}
          required
          placeholder="What should students do? Where do they submit?"
          className={cn(inputCls, "resize-y")}
        />
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? <Loader2 size={15} className="animate-spin" /> : <BookOpen size={15} />}
          {pending ? "Creating…" : "Create activity"}
        </button>
        {done && (
          <span className="text-[13px] font-bold text-mint-600">
            Created — students now see it in their activity list.
          </span>
        )}
      </div>
    </form>
  );
}

export function QuizCreateForm({ classes }: { classes: ClassOption[] }) {
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const current = classes.find((c) => c.id === classId);
  const [subject, setSubject] = useState(current?.subjects[0]?.name ?? "");
  const currentSubject = current?.subjects.find((s) => s.name === subject);
  const [chapter, setChapter] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  const submit = (fd: FormData) => {
    setResult(null);
    startTransition(async () => {
      try {
        const res = await createClassQuizAction(fd);
        setResult(`Quiz created (id ${res.quizId.slice(-6)}) — students can take it now from their Quizzes section.`);
      } catch (e) {
        setResult(e instanceof Error ? e.message : "Failed to create quiz.");
      }
    });
  };

  return (
    <form action={submit} className="grid gap-3.5 p-5 pt-4 sm:grid-cols-2">
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="subject" value={subject} />
      <input type="hidden" name="chapter" value={chapter} />
      <div>
        <label className={labelCls}>Class</label>
        <select
          className={inputCls}
          value={classId}
          onChange={(e) => {
            setClassId(e.target.value);
            const c = classes.find((x) => x.id === e.target.value);
            setSubject(c?.subjects[0]?.name ?? "");
            setChapter("");
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
            setChapter("");
          }}
        >
          {(current?.subjects ?? []).map((s) => (
            <option key={s.name} value={s.name}>{s.name}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className={labelCls}>Chapter focus (optional — AI picks questions from the syllabus)</label>
        <select className={inputCls} value={chapter} onChange={(e) => setChapter(e.target.value)}>
          <option value="">Auto (balanced across syllabus)</option>
          {(currentSubject?.chapters ?? []).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          {pending ? "Generating…" : "Generate AI quiz"}
        </button>
        <span className="text-[12.5px] text-ink-500">
          5 MCQs from the {subject} question bank, aligned to CBSE syllabus chapters.
        </span>
      </div>
      {result && (
        <p className="rounded-xl bg-brand-50 px-3.5 py-2.5 text-[13px] font-semibold text-brand-700 sm:col-span-2">
          {result}
        </p>
      )}
    </form>
  );
}

export function PracticeQuizButton() {
  const [pending, startTransition] = useTransition();
  return (
    <form
      action={() => startTransition(() => generatePracticeQuizAction())}
    >
      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
        {pending ? "Preparing…" : "Generate AI practice quiz"}
      </button>
    </form>
  );
}
