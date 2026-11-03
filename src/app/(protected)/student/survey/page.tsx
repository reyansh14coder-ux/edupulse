import { BarChart3, CheckCircle2 } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { respondSurveyAction } from "@/app/actions/erp";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
} from "@/components/ui";

export const metadata = { title: "Surveys" };

const NOW = Date.now();

export default async function StudentSurveyPage() {
  const session = await requireSession(["STUDENT"]);
  const surveys = await db.survey.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { responses: { where: { respondentId: session.sub } } },
  });
  const open = surveys.filter(
    (s) => !s.closesOn || s.closesOn.getTime() >= NOW
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Surveys"
        sub="Quick school polls — your answer updates the results instantly."
        action={<Badge tone="info">{open.length} open</Badge>}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {surveys.map((s) => {
          let options: string[] = [];
          try {
            options = JSON.parse(s.options) as string[];
          } catch {
            options = [];
          }
          const mine = s.responses[0];
          return (
            <Card key={s.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge tone="brand">{s.audience.toLowerCase()}</Badge>
                {s.closesOn && (
                  <span className="text-[12px] font-semibold text-ink-400">
                    closes {fmtDate(s.closesOn)}
                  </span>
                )}
              </div>
              <p className="mt-2 text-[14.5px] font-bold text-ink-900">{s.title}</p>
              <p className="text-[13px] text-ink-600">{s.question}</p>
              {mine ? (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-mint-500/10 px-4 py-3 text-[13px] font-bold text-mint-700">
                  <CheckCircle2 size={15} />
                  You answered: {options[mine.choice] ?? "recorded"}
                </div>
              ) : (
                <form action={respondSurveyAction} className="mt-3 space-y-2">
                  <input type="hidden" name="surveyId" value={s.id} />
                  {options.map((opt, i) => (
                    <label
                      key={opt}
                      className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line px-3.5 py-2.5 text-[13px] font-semibold text-ink-700 transition hover:border-brand-400 hover:bg-brand-50/50"
                    >
                      <input type="radio" name="choice" value={i} required className="accent-brand-600" />
                      {opt}
                    </label>
                  ))}
                  <Button type="submit">Submit answer</Button>
                </form>
              )}
            </Card>
          );
        })}
        {!surveys.length && (
          <Card className="md:col-span-2">
            <EmptyState title="No surveys right now" hint="School polls will appear here." icon={<BarChart3 size={20} />} />
          </Card>
        )}
      </div>
    </div>
  );
}
