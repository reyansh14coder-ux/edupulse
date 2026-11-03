import { Star, Plus } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAppraisalAction } from "@/app/actions/erp";
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

export const metadata = { title: "Appraisals" };

export default async function AdminAppraisalsPage() {
  await requireSession(["ADMIN"]);
  const [appraisals, staff] = await Promise.all([
    db.appraisal.findMany({
      orderBy: { createdAt: "desc" },
      include: { staff: { select: { name: true, title: true } } },
    }),
    db.user.findMany({
      where: { role: "TEACHER" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Appraisals"
        sub="Performance reviews with ratings, strengths and growth areas."
        action={<Badge tone="info">{appraisals.length} reviews</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {appraisals.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[14.5px] font-bold text-ink-900">
                    {a.staff.name}
                    {a.staff.title ? ` · ${a.staff.title}` : ""}
                  </p>
                  <p className="text-[12.5px] text-ink-500">{a.period}</p>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 ring-1 ring-amber-200">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span className="text-[13px] font-bold text-amber-700">{a.rating.toFixed(1)}</span>
                </div>
              </div>
              {a.strengths && (
                <p className="mt-2 text-[13px] leading-relaxed text-ink-700">
                  <span className="font-bold text-mint-600">Strengths: </span>
                  {a.strengths}
                </p>
              )}
              {a.improvements && (
                <p className="mt-1 text-[13px] leading-relaxed text-ink-700">
                  <span className="font-bold text-brand-600">Grow: </span>
                  {a.improvements}
                </p>
              )}
            </Card>
          ))}
          {!appraisals.length && (
            <Card>
              <EmptyState title="No appraisals yet" hint="Write the first review from the form." icon={<Star size={20} />} />
            </Card>
          )}
        </div>

        <Card className="h-fit p-6">
          <CardHeader title="New appraisal" className="!px-0 !pt-0" />
          <form action={createAppraisalAction} className="mt-4 space-y-3">
            <div>
              <label className={labelCls} htmlFor="ap-staff">Staff member</label>
              <select id="ap-staff" name="staffId" className={inputCls} required>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="ap-period">Period</label>
                <input id="ap-period" name="period" required maxLength={40} placeholder="2026 H1" defaultValue="2026 H2" className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor="ap-rating">Rating (1-5)</label>
                <input id="ap-rating" name="rating" type="number" min={1} max={5} step="0.1" required defaultValue={4} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls} htmlFor="ap-str">Strengths</label>
              <textarea id="ap-str" name="strengths" rows={2} maxLength={800} className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="ap-imp">Improvements</label>
              <textarea id="ap-imp" name="improvements" rows={2} maxLength={800} className={inputCls} />
            </div>
            <Button type="submit">
              <Plus size={15} /> Save appraisal
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
