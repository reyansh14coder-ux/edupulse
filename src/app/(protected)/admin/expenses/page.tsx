import { Receipt, Plus } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { addExpenseAction } from "@/app/actions/erp";
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

export const metadata = { title: "Expenses" };

const CATEGORIES = [
  "Salaries",
  "Utilities",
  "Transport",
  "Maintenance",
  "Library & Labs",
  "Events & Activities",
];

export default async function AdminExpensesPage() {
  await requireSession(["ADMIN"]);
  const expenses = await db.expense.findMany({ orderBy: { spentOn: "desc" }, take: 100 });
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Expenses"
        sub="Every rupee out — salaries, bills, supplies and events."
        action={<Badge tone="warning">₹{total.toLocaleString("en-IN")} recent</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          {expenses.length ? (
            <div className="overflow-x-auto px-2 pb-3 pt-3">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-ink-400">
                    <th className="px-4 py-2 font-bold">Date</th>
                    <th className="px-4 py-2 font-bold">Expense</th>
                    <th className="px-4 py-2 font-bold">Category</th>
                    <th className="px-4 py-2 font-bold">Vendor</th>
                    <th className="px-4 py-2 font-bold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id} className="border-t border-line">
                      <td className="whitespace-nowrap px-4 py-2.5 text-[12.5px] text-ink-500">
                        {fmtDate(e.spentOn)}
                      </td>
                      <td className="px-4 py-2.5 text-[13px] font-bold text-ink-800">{e.title}</td>
                      <td className="px-4 py-2.5">
                        <Badge tone="neutral">{e.category}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-[12.5px] text-ink-500">{e.vendor ?? "—"}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right text-[13px] font-bold text-ink-900">
                        ₹{e.amount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No expenses yet" hint="Record the first expense from the form." icon={<Receipt size={20} />} />
          )}
        </Card>

        <Card className="h-fit p-6">
          <CardHeader title="Record an expense" className="!px-0 !pt-0" />
          <form action={addExpenseAction} className="mt-4 space-y-3">
            <div>
              <label className={labelCls} htmlFor="ex-title">Title</label>
              <input id="ex-title" name="title" required maxLength={200} placeholder="October electricity bill" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="ex-amt">Amount (₹)</label>
                <input id="ex-amt" name="amount" type="number" min={1} required className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor="ex-date">Date</label>
                <input id="ex-date" name="spentOn" type="date" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls} htmlFor="ex-cat">Category</label>
              <select id="ex-cat" name="category" className={inputCls} required>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="ex-vendor">Vendor</label>
              <input id="ex-vendor" name="vendor" maxLength={120} className={inputCls} />
            </div>
            <Button type="submit">
              <Plus size={15} /> Add expense
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
