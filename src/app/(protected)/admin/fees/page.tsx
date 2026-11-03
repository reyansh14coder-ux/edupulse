import { IndianRupee, Plus } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import {
  createFeeHeadAction,
  createFeeInvoiceAction,
  markInvoicePaidAction,
} from "@/app/actions/erp";
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

export const metadata = { title: "Fees" };

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  PAID: "success",
  PENDING: "warning",
  OVERDUE: "danger",
};

export default async function AdminFeesPage() {
  await requireSession(["ADMIN"]);

  const [heads, invoices, students, payments] = await Promise.all([
    db.feeHead.findMany({ orderBy: { name: "asc" } }),
    db.feeInvoice.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            schoolClass: { select: { name: true, section: true } },
          },
        },
        head: { select: { name: true } },
      },
    }),
    db.student.findMany({
      orderBy: { rollNo: "asc" },
      include: {
        user: { select: { name: true } },
        schoolClass: { select: { name: true, section: true } },
      },
    }),
    db.feePayment.findMany({
      orderBy: { paidOn: "desc" },
      take: 20,
      include: { student: { include: { user: { select: { name: true } } } } },
    }),
  ]);

  const outstanding = invoices
    .filter((i) => i.status !== "PAID")
    .reduce((sum, i) => sum + i.amount, 0);
  const collected = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Fees & payments"
        sub="Heads, invoices and receipts. Mark invoices paid as money comes in — parents see the same status live."
        action={
          <div className="flex gap-2">
            <Badge tone="danger">₹{outstanding.toLocaleString("en-IN")} due</Badge>
            <Badge tone="success">₹{collected.toLocaleString("en-IN")} recent</Badge>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card>
          <div className="flex items-center justify-between px-6 pt-6">
            <CardHeader
              title="Invoices"
              sub="Latest 60 across all classes"
              className="!px-0 !pt-0"
            />
          </div>
          {invoices.length ? (
            <div className="overflow-x-auto px-2 pb-3 pt-3">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-ink-400">
                    <th className="px-4 py-2 font-bold">Student</th>
                    <th className="px-4 py-2 font-bold">Invoice</th>
                    <th className="px-4 py-2 font-bold">Due</th>
                    <th className="px-4 py-2 font-bold">Amount</th>
                    <th className="px-4 py-2 font-bold">Status</th>
                    <th className="px-4 py-2 font-bold">Collect</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-t border-line align-top">
                      <td className="px-4 py-2.5">
                        <p className="text-[13px] font-bold text-ink-900">
                          {inv.student.user.name}
                        </p>
                        <p className="text-[11px] text-ink-400">
                          {inv.student.schoolClass.name} {inv.student.schoolClass.section} · R{inv.student.rollNo}
                        </p>
                      </td>
                      <td className="px-4 py-2.5 text-[12.5px] text-ink-600">
                        {inv.title}
                        {inv.head && (
                          <span className="block text-[11px] text-ink-400">{inv.head.name}</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-[12.5px] text-ink-500">
                        {fmtDate(inv.dueDate)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-[13px] font-bold text-ink-900">
                        ₹{inv.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge tone={STATUS_TONE[inv.status] ?? "neutral"}>
                          {inv.status.toLowerCase()}
                          {inv.paidOn ? ` · ${fmtDate(inv.paidOn)}` : ""}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        {inv.status !== "PAID" ? (
                          <form
                            action={markInvoicePaidAction}
                            className="flex items-center gap-1.5"
                          >
                            <input type="hidden" name="invoiceId" value={inv.id} />
                            <select name="mode" className="rounded-lg border border-line bg-card px-2 py-1.5 text-[12px] font-semibold text-ink-700">
                              <option value="CASH">Cash</option>
                              <option value="UPI">UPI</option>
                              <option value="CARD">Card</option>
                              <option value="BANK">Bank</option>
                            </select>
                            <Button type="submit" size="sm">Mark paid</Button>
                          </form>
                        ) : (
                          <span className="text-[11.5px] font-semibold text-ink-400">settled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No invoices yet"
              hint="Create one from the form on the right."
              icon={<IndianRupee size={20} />}
            />
          )}
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <CardHeader title="New invoice" className="!px-0 !pt-0" />
            <form action={createFeeInvoiceAction} className="mt-4 space-y-3">
              <div>
                <label className={labelCls} htmlFor="inv-student">Student</label>
                <select id="inv-student" name="studentId" className={inputCls} required>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.user.name} · {s.schoolClass.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="inv-head">Fee head (optional)</label>
                <select id="inv-head" name="headId" className={inputCls} defaultValue="">
                  <option value="">— none —</option>
                  {heads.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="inv-title">Title</label>
                <input
                  id="inv-title"
                  name="title"
                  required
                  maxLength={160}
                  placeholder="Tuition Fee — December 2026"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="inv-amount">Amount (₹)</label>
                  <input id="inv-amount" name="amount" type="number" min={1} step="1" required className={inputCls} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="inv-due">Due date</label>
                  <input id="inv-due" name="dueDate" type="date" required className={inputCls} />
                </div>
              </div>
              <Button type="submit">
                <Plus size={15} /> Create invoice
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <CardHeader title="Fee heads" className="!px-0 !pt-0" />
            <ul className="mt-3 space-y-2">
              {heads.map((h) => (
                <li key={h.id} className="flex items-center justify-between rounded-xl border border-line px-3 py-2">
                  <div>
                    <p className="text-[13px] font-bold text-ink-800">{h.name}</p>
                    <p className="text-[11px] text-ink-400">{h.frequency.toLowerCase()}</p>
                  </div>
                  <span className="text-[13px] font-bold text-ink-900">
                    ₹{h.amount.toLocaleString("en-IN")}
                  </span>
                </li>
              ))}
            </ul>
            <form action={createFeeHeadAction} className="mt-4 space-y-3 border-t border-line pt-4">
              <div>
                <label className={labelCls} htmlFor="fh-name">Head name</label>
                <input id="fh-name" name="name" required maxLength={80} placeholder="Hostel Fee" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="fh-amount">Amount (₹)</label>
                  <input id="fh-amount" name="amount" type="number" min={1} required className={inputCls} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="fh-freq">Frequency</label>
                  <select id="fh-freq" name="frequency" className={inputCls}>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="ONE_TIME">One time</option>
                  </select>
                </div>
              </div>
              <Button type="submit" variant="outline">
                <Plus size={15} /> Add head
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
