import { BarChart3, Plus } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { createSurveyAction } from "@/app/actions/erp";
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

export const metadata = { title: "Surveys" };

export default async function AdminSurveysPage() {
  await requireSession(["ADMIN"]);
  const surveys = await db.survey.findMany({
    orderBy: { createdAt: "desc" },
    include: { responses: { select: { choice: true } } },
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Surveys"
        sub="Quick polls for students, parents or everyone — results update live."
        action={<Badge tone="info">{surveys.length} surveys</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {surveys.map((s) => {
            let options: string[] = [];
            try {
              options = JSON.parse(s.options) as string[];
            } catch {
              options = [];
            }
            const total = s.responses.length;
            const counts = options.map(
              (_, i) => s.responses.filter((r) => r.choice === i).length
            );
            return (
              <Card key={s.id} className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge tone="brand">{s.audience.toLowerCase()}</Badge>
                    {s.closesOn && (
                      <Badge tone="neutral">closes {fmtDate(s.closesOn)}</Badge>
                    )}
                  </div>
                  <span className="text-[12.5px] font-bold text-ink-500">
                    {total} responses
                  </span>
                </div>
                <p className="mt-2 text-[14.5px] font-bold text-ink-900">{s.title}</p>
                <p className="text-[13px] text-ink-600">{s.question}</p>
                <ul className="mt-3 space-y-2">
                  {options.map((opt, i) => {
                    const pct = total ? Math.round((counts[i] / total) * 100) : 0;
                    return (
                      <li key={opt}>
                        <div className="flex items-center justify-between text-[12.5px]">
                          <span className="font-semibold text-ink-700">{opt}</span>
                          <span className="font-bold text-ink-500">
                            {counts[i]} · {pct}%
                          </span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink-100">
                          <div
                            className="h-full rounded-full bg-brand-600 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {!total && (
                  <p className="mt-3 text-[12px] text-ink-400">
                    No responses yet — respondents answer from their own dashboard.
                  </p>
                )}
              </Card>
            );
          })}
          {!surveys.length && (
            <Card>
              <EmptyState title="No surveys yet" hint="Create the first poll from the form." icon={<BarChart3 size={20} />} />
            </Card>
          )}
        </div>

        <Card className="h-fit p-6">
          <CardHeader title="New survey" className="!px-0 !pt-0" />
          <form action={createSurveyAction} className="mt-4 space-y-3">
            <div>
              <label className={labelCls} htmlFor="sv-title">Title</label>
              <input id="sv-title" name="title" required maxLength={160} className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="sv-q">Question</label>
              <textarea id="sv-q" name="question" required rows={2} maxLength={500} className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="sv-opts">Options (one per line, 2-6)</label>
              <textarea
                id="sv-opts"
                name="options"
                required
                rows={4}
                maxLength={600}
                placeholder={"Love it\nIt's okay\nNeeds improvement"}
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="sv-aud">Audience</label>
                <select id="sv-aud" name="audience" className={inputCls}>
                  <option value="ALL">Everyone</option>
                  <option value="STUDENT">Students</option>
                  <option value="PARENT">Parents</option>
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="sv-close">Closes on</label>
                <input id="sv-close" name="closesOn" type="date" className={inputCls} />
              </div>
            </div>
            <Button type="submit">
              <Plus size={15} /> Create survey
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
