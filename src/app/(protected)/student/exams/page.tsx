import { GraduationCap } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "Competitive exams" };

const NOW = Date.now();

export default async function StudentExamsPage() {
  await requireSession(["STUDENT"]);
  const exams = await db.examOpportunity.findMany({ orderBy: { deadline: "asc" } });
  const now = NOW;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Competitive exams"
        sub="Olympiads, scholarships and talent tests — grab the ones that fit your class."
        action={<Badge tone="info">{exams.length} opportunities</Badge>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {exams.map((e) => {
          const closed = e.deadline ? e.deadline.getTime() < now : false;
          return (
            <Card key={e.id} className="flex flex-col p-5">
              <div className="flex flex-wrap items-center gap-2">
                {e.classes && <Badge tone="brand">{e.classes}</Badge>}
                <Badge tone={closed ? "neutral" : "warning"}>
                  {e.deadline ? (closed ? `closed ${fmtDate(e.deadline)}` : `by ${fmtDate(e.deadline)}`) : "open"}
                </Badge>
              </div>
              <p className="mt-2 text-[14.5px] font-bold text-ink-900">{e.name}</p>
              <p className="mt-1 flex-1 text-[13px] leading-relaxed text-ink-600">{e.body}</p>
              {e.examOn && (
                <p className="mt-2 text-[12.5px] font-bold text-ink-500">Exam: {fmtDate(e.examOn)}</p>
              )}
              {e.link && (
                <a
                  href={e.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[13px] font-bold text-brand-600 hover:underline"
                >
                  Learn more →
                </a>
              )}
            </Card>
          );
        })}
        {!exams.length && (
          <Card className="md:col-span-2 xl:col-span-3">
            <EmptyState
              title="No exams listed yet"
              hint="Your school will post opportunities here."
              icon={<GraduationCap size={20} />}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
