import { ClipboardList, Plus } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { createLessonPlanAction } from "@/app/actions/erp";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  inputCls,
  labelCls,
} from "@/components/ui";
import { SUBJECTS } from "@/lib/question-bank";

export const metadata = { title: "Lesson plans" };

const TONE: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  APPROVED: "success",
  SUBMITTED: "info",
  REVISION: "warning",
};

export default async function TeacherLessonPlansPage() {
  const session = await requireSession(["TEACHER"]);
  const [plans, assignments] = await Promise.all([
    db.lessonPlan.findMany({
      where: { teacherId: session.sub },
      orderBy: { weekOf: "desc" },
      include: { schoolClass: { select: { name: true, section: true } } },
    }),
    db.teacherAssignment.findMany({
      where: { teacherId: session.sub },
      include: { schoolClass: { select: { name: true, section: true, id: true } } },
    }),
  ]);
  const monday = (() => {
    const d = new Date();
    const day = d.getDay();
    d.setDate(d.getDate() - ((day + 6) % 7));
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  })();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Lesson plans"
        sub="Plan your week — objectives, activities and resources, sent for approval."
        action={<Badge tone={plans.some((p) => p.status === "REVISION") ? "warning" : "info"}>
          {plans.length} plans
        </Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {plans.map((p) => (
            <Card key={p.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={TONE[p.status] ?? "neutral"}>{p.status.toLowerCase()}</Badge>
                  <Badge tone="neutral">week of {fmtDate(p.weekOf)}</Badge>
                </div>
                <span className="text-[12.5px] font-bold text-ink-500">
                  {p.subject} · {p.schoolClass.name} {p.schoolClass.section}
                </span>
              </div>
              <p className="mt-1.5 text-[14px] font-bold text-ink-900">{p.chapter}</p>
              <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-ink-700">
                {p.objectives}
              </p>
              {p.activities && (
                <p className="mt-1.5 text-[12.5px] text-ink-500">Activities: {p.activities}</p>
              )}
              {p.resources && (
                <p className="mt-1 break-all text-[12px] text-ink-400">Resources: {p.resources}</p>
              )}
              {p.status === "REVISION" && (
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[12.5px] font-semibold text-amber-700">
                  Principal requested changes — update and resubmit.
                </p>
              )}
            </Card>
          ))}
          {!plans.length && (
            <Card>
              <EmptyState
                title="No plans yet"
                hint="Submit your first weekly plan from the form."
                icon={<ClipboardList size={20} />}
              />
            </Card>
          )}
        </div>

        <Card className="h-fit p-6">
          <CardHeader title="New weekly plan" className="!px-0 !pt-0" />
          <form action={createLessonPlanAction} className="mt-4 space-y-3">
            <div>
              <label className={labelCls} htmlFor="lp-class">Class</label>
              <select id="lp-class" name="classId" className={inputCls} required>
                {assignments.map((a) => (
                  <option key={a.id} value={a.schoolClass.id}>
                    {a.schoolClass.name} {a.schoolClass.section} · {a.subject}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="lp-subject">Subject</label>
                <select id="lp-subject" name="subject" className={inputCls} required>
                  {assignments.map((a) => (
                    <option key={a.id} value={a.subject}>{a.subject}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="lp-week">Week of</label>
                <input id="lp-week" name="weekOf" type="date" defaultValue={monday} required className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls} htmlFor="lp-chapter">Chapter / topic</label>
              <input id="lp-chapter" name="chapter" required maxLength={160} className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="lp-obj">Objectives (one per line)</label>
              <textarea id="lp-obj" name="objectives" required rows={4} maxLength={2000} className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="lp-act">Activities</label>
              <textarea id="lp-act" name="activities" rows={3} maxLength={2000} className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="lp-res">Resources (links, one per line)</label>
              <textarea id="lp-res" name="resources" rows={2} maxLength={600} className={inputCls} />
            </div>
            <Button type="submit">
              <Plus size={15} /> Submit plan
            </Button>
          </form>
          <p className="mt-3 text-[12px] text-ink-400">
            Subjects taught: {assignments.map((a) => a.subject).join(", ") || SUBJECTS.slice(0, 3).join(", ")}
          </p>
        </Card>
      </div>
    </div>
  );
}
