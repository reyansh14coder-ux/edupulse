import { PieChart, Plus } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { addBudgetLineAction } from "@/app/actions/erp";
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

export const metadata = { title: "Budget" };

export default async function AdminBudgetPage() {
  await requireSession(["ADMIN"]);
  const year = "2026-27";
  const [lines, expenses] = await Promise.all([
    db.budgetLine.findMany({ where: { year }, orderBy: { category: "asc" } }),
    db.expense.findMany({ take: 200 }),
  ]);

  const spentByCat = new Map<string, number>();
  for (const e of expenses) {
    spentByCat.set(e.category, (spentByCat.get(e.category) ?? 0) + e.amount);
  }
  const plannedTotal = lines.reduce((s, l) => s + l.planned, 0);
  const spentTotal = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Budget ${year}`}
        sub="Planned vs actual spend by category — the school's financial shape at a glance."
        action={
          <div className="flex gap-2">
            <Badge tone="info">₹{plannedTotal.toLocaleString("en-IN")} planned</Badge>
            <Badge tone="warning">₹{spentTotal.toLocaleString("en-IN")} spent</Badge>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          {lines.length ? (
            <div className="divide-y divide-line">
              {lines.map((l) => {
                const spent = spentByCat.get(l.category) ?? 0;
                const pct = l.planned ? Math.min(100, Math.round((spent / l.planned) * 100)) : 0;
                const over = spent > l.planned;
                return (
                  <div key={l.id} className="px-6 py-4">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-bold text-ink-900">{l.category}</span>
                      <span className={over ? "font-bold text-rose-600" : "font-semibold text-ink-500"}>
                        ₹{spent.toLocaleString("en-IN")} / ₹{l.planned.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-ink-100">
                      <div
                        className={`h-full rounded-full ${over ? "bg-rose-500" : pct > 80 ? "bg-amber-500" : "bg-brand-600"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11.5px] text-ink-400">{pct}% utilized</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No budget lines yet" hint="Add categories from the form." icon={<PieChart size={20} />} />
          )}
        </Card>

        <Card className="h-fit p-6">
          <CardHeader title="Set a budget line" className="!px-0 !pt-0" />
          <form action={addBudgetLineAction} className="mt-4 space-y-3">
            <div>
              <label className={labelCls} htmlFor="bl-cat">Category</label>
              <input id="bl-cat" name="category" required maxLength={80} placeholder="Sports & games" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="bl-amount">Planned (₹)</label>
                <input id="bl-amount" name="planned" type="number" min={1} required className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor="bl-year">Year</label>
                <input id="bl-year" name="year" defaultValue={year} maxLength={20} className={inputCls} />
              </div>
            </div>
            <Button type="submit">
              <Plus size={15} /> Save line
            </Button>
          </form>
          <p className="mt-3 text-[12px] text-ink-400">
            Actuals come from the{" "}
            <a href="/admin/expenses" className="font-bold text-brand-600 hover:underline">
              expenses register
            </a>
            .
          </p>
        </Card>
      </div>
    </div>
  );
}
