import { IndianRupee } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { payInvoiceAction } from "@/app/actions/erp";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  inputCls,
} from "@/components/ui";

export const metadata = { title: "Fees" };

export default async function ParentFeesPage() {
  const session = await requireSession(["PARENT"]);
  const link = await db.parentLink.findFirst({
    where: { parentId: session.sub },
    include: {
      student: {
        include: { user: { select: { name: true } }, schoolClass: { select: { name: true } } },
      },
    },
  });
  const invoices = link
    ? await db.feeInvoice.findMany({
        where: { studentId: link.student.id },
        orderBy: { dueDate: "desc" },
        include: { head: { select: { name: true } } },
      })
    : [];
  const due = invoices.filter((i) => i.status !== "PAID");
  const dueTotal = due.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Fees"
        sub={
          link
            ? `Invoices for ${link.student.user.name} (${link.student.schoolClass.name}).`
            : "Fee invoices for your child."
        }
        action={
          <Badge tone={due.length ? "danger" : "success"}>
            {due.length ? `₹${dueTotal.toLocaleString("en-IN")} due` : "all settled"}
          </Badge>
        }
      />

      <Card>
        {invoices.length ? (
          <div className="divide-y divide-line">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      tone={inv.status === "PAID" ? "success" : inv.status === "OVERDUE" ? "danger" : "warning"}
                    >
                      {inv.status.toLowerCase()}
                    </Badge>
                    {inv.head && <Badge tone="neutral">{inv.head.name}</Badge>}
                  </div>
                  <p className="mt-1.5 text-[14px] font-bold text-ink-900">{inv.title}</p>
                  <p className="text-[12.5px] text-ink-500">
                    Due {fmtDate(inv.dueDate)}
                    {inv.paidOn ? ` · paid ${fmtDate(inv.paidOn)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[16px] font-bold text-ink-900">
                    ₹{inv.amount.toLocaleString("en-IN")}
                  </span>
                  {inv.status !== "PAID" && (
                    <form action={payInvoiceAction} className="flex items-center gap-1.5">
                      <input type="hidden" name="invoiceId" value={inv.id} />
                      <select name="mode" className={inputCls + " !w-auto !py-1.5 text-[12.5px]"}>
                        <option value="UPI">UPI</option>
                        <option value="CARD">Card</option>
                        <option value="BANK">Net banking</option>
                      </select>
                      <Button type="submit" size="sm">
                        <IndianRupee size={13} /> Pay now
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No invoices yet" hint="Fee invoices will appear here." icon={<IndianRupee size={20} />} />
        )}
      </Card>
      <p className="mt-3 text-[12px] text-ink-400">Demo payments are simulated.</p>
    </div>
  );
}
