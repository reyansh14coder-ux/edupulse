import { GraduationCap, Plus } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { createExamAction } from "@/app/actions/erp";
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

export const metadata = { title: "Competitive exams" };

const NOW = Date.now();

export default async function AdminExamsPage() {
  await requireSession(["ADMIN"]);
  const exams = await db.examOpportunity.findMany({ orderBy: { deadline: "asc" } });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Competitive exams"
        sub="Olympiads, scholarships and entrance tests — students see these on their dashboard."
        action={<Badge tone="info">{exams.length} listed</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {exams.map((e) => (
            <Card key={e.id} className="p-6">
              <div className="flex flex-wrap items-center gap-2">
                {e.classes && <Badge tone="brand">{e.classes}</Badge>}
                {e.examOn && <Badge tone="info">exam {fmtDate(e.examOn)}</Badge>}
                {e.deadline && (
                  <Badge tone={e.deadline.getTime() < NOW ? "neutral" : "warning"}>
                    apply by {fmtDate(e.deadline)}
                  </Badge>
                )}
              </div>
              <p className="mt-2 text-[15px] font-bold text-ink-900">{e.name}</p>
              <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-ink-700">{e.body}</p>
              {e.link && (
                <a
                  href={e.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[13px] font-bold text-brand-600 hover:underline"
                >
                  Official page →
                </a>
              )}
            </Card>
          ))}
          {!exams.length && (
            <Card>
              <EmptyState title="No exams listed yet" hint="Add the first opportunity from the form." icon={<GraduationCap size={20} />} />
            </Card>
          )}
        </div>

        <Card className="h-fit p-6">
          <CardHeader title="List an exam" className="!px-0 !pt-0" />
          <form action={createExamAction} className="mt-4 space-y-3">
            <div>
              <label className={labelCls} htmlFor="ex-name">Name</label>
              <input id="ex-name" name="name" required maxLength={160} placeholder="NTSE (National Talent Search Exam)" className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="ex-body">Details</label>
              <textarea id="ex-body" name="body" required rows={4} maxLength={1200} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="ex-on">Exam date</label>
                <input id="ex-on" name="examOn" type="date" className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor="ex-dl">Apply by</label>
                <input id="ex-dl" name="deadline" type="date" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls} htmlFor="ex-classes">Eligible classes</label>
              <input id="ex-classes" name="classes" maxLength={80} placeholder="Classes 6-10" className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="ex-link">Link</label>
              <input id="ex-link" name="link" type="url" maxLength={400} className={inputCls} />
            </div>
            <Button type="submit">
              <Plus size={15} /> Add exam
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
