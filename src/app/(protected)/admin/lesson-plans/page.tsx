import { ClipboardCheck, RefreshCw } from "lucide-react";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { updateLessonPlanStatusAction } from "@/app/actions/erp";
import { Badge, Button, Card, EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "Lesson plans" };

const TONE: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  APPROVED: "success",
  SUBMITTED: "info",
  REVISION: "warning",
};

export default async function AdminLessonPlansPage() {
  await requireSession(["ADMIN"]);
  const plans = await db.lessonPlan.findMany({
    orderBy: [{ weekOf: "desc" }, { createdAt: "desc" }],
    take: 60,
    include: {
      teacher: { select: { name: true, title: true } },
      schoolClass: { select: { name: true, section: true } },
    },
  });
  const pending = plans.filter((p) => p.status === "SUBMITTED");

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Lesson plans"
        sub="Weekly plans submitted by teachers — approve, or send back with the revision flow."
        action={<Badge tone={pending.length ? "warning" : "neutral"}>{pending.length} awaiting review</Badge>}
      />

      <Card>
        {plans.length ? (
          <div className="divide-y divide-line">
            {plans.map((p) => (
              <div key={p.id} className="px-6 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={TONE[p.status] ?? "neutral"}>{p.status.toLowerCase()}</Badge>
                      <Badge tone="neutral">week of {fmtDate(p.weekOf)}</Badge>
                    </div>
                    <p className="mt-1.5 text-[14px] font-bold text-ink-900">
                      {p.subject} · {p.chapter} · {p.schoolClass.name} {p.schoolClass.section}
                    </p>
                    <p className="text-[12.5px] text-ink-500">
                      {p.teacher.name}
                      {p.teacher.title ? ` · ${p.teacher.title}` : ""}
                    </p>
                    <p className="mt-1.5 max-w-2xl whitespace-pre-line text-[13px] leading-relaxed text-ink-700">
                      {p.objectives}
                    </p>
                    {p.activities && (
                      <p className="mt-1 max-w-2xl text-[12.5px] text-ink-500">
                        Activities: {p.activities}
                      </p>
                    )}
                    {p.resources && (
                      <p className="mt-1 max-w-2xl break-all text-[12px] text-ink-400">
                        Resources: {p.resources}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {p.status !== "APPROVED" && (
                      <form action={updateLessonPlanStatusAction.bind(null, p.id, "APPROVED")}>
                        <Button type="submit" size="sm">
                          <ClipboardCheck size={13} /> Approve
                        </Button>
                      </form>
                    )}
                    {p.status === "APPROVED" && (
                      <form action={updateLessonPlanStatusAction.bind(null, p.id, "REVISION")}>
                        <Button type="submit" size="sm" variant="outline">
                          <RefreshCw size={13} /> Request changes
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No lesson plans yet"
            hint="Teachers submit weekly plans from their Lesson plans page."
            icon={<ClipboardCheck size={20} />}
          />
        )}
      </Card>
      <p className="mt-3 text-[12.5px] text-ink-400">
        Teachers create plans at{" "}
        <Link href="/teacher/lesson-plans" className="font-bold text-brand-600 hover:underline">
          /teacher/lesson-plans
        </Link>
        .
      </p>
    </div>
  );
}
