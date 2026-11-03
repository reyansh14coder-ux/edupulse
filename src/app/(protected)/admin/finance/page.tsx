import {
  BadgeCheck,
  PackageCheck,
  PieChart,
  Receipt,
  Store,
} from "lucide-react";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, Card, PageHeader } from "@/components/ui";

export const metadata = { title: "Finance" };

export default async function AdminFinancePage() {
  await requireSession(["ADMIN"]);
  const [budgetTotal, expenseTotal, vendorCount, pendingPR, invoiceDue] =
    await Promise.all([
      db.budgetLine.aggregate({ _sum: { planned: true } }),
      db.expense.aggregate({ _sum: { amount: true } }),
      db.vendor.count(),
      db.purchaseRequest.count({ where: { status: "PENDING" } }),
      db.feeInvoice.aggregate({
        _sum: { amount: true },
        where: { status: { not: "PAID" } },
      }),
    ]);

  const planned = budgetTotal._sum.planned ?? 0;
  const spent = expenseTotal._sum.amount ?? 0;
  const due = invoiceDue._sum.amount ?? 0;

  const CARDS = [
    { href: "/admin/budget", label: "Budget", hint: "Planned vs actual by category", icon: PieChart, stat: `₹${planned.toLocaleString("en-IN")}`, unit: "planned" },
    { href: "/admin/expenses", label: "Expenses", hint: "Bills, salaries and supplies", icon: Receipt, stat: `₹${spent.toLocaleString("en-IN")}`, unit: "recorded" },
    { href: "/admin/vendors", label: "Vendors", hint: "Suppliers and contacts", icon: Store, stat: String(vendorCount), unit: "vendors" },
    { href: "/admin/procurement", label: "Procurement", hint: "Purchase requests to review", icon: PackageCheck, stat: String(pendingPR), unit: "pending" },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Finance"
        sub="Budget, spend, vendors and procurement — with fee collection feeding the same picture."
        action={<Badge tone="brand"><BadgeCheck size={12} /> Finance control</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="group">
            <Card className="h-full p-5 transition group-hover:-translate-y-0.5 group-hover:shadow-lg">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <c.icon size={18} />
              </span>
              <p className="mt-3 text-[14.5px] font-bold text-ink-900 group-hover:text-brand-700">
                {c.label}
              </p>
              <p className="mt-0.5 text-[12.5px] text-ink-500">{c.hint}</p>
              <p className="mt-3 truncate text-[20px] font-bold text-ink-900">
                {c.stat}{" "}
                <span className="text-[12px] font-semibold text-ink-400">{c.unit}</span>
              </p>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-6 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="text-[14.5px] font-bold text-ink-900">Fee collection</p>
          <p className="text-[12.5px] text-ink-500">
            Outstanding invoices across all classes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[22px] font-bold text-rose-600">
            ₹{due.toLocaleString("en-IN")}
          </span>
          <Link href="/admin/fees">
            <Badge tone="info">open fees →</Badge>
          </Link>
        </div>
      </Card>
    </div>
  );
}
