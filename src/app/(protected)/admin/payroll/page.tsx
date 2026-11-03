import { Wallet } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { addPayrollAction, markPayrollPaidAction } from "@/app/actions/erp";
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

export const metadata = { title: "Payroll" };

const TONE: Record<string, "success" | "warning" | "neutral"> = {
  PAID: "success",
  DRAFT: "warning",
  VOID: "neutral",
};

export default async function AdminPayrollPage() {
  await requireSession(["ADMIN"]);
  const [records, staff] = await Promise.all([
    db.payrollRecord.findMany({
      orderBy: [{ month: "desc" }, { status: "asc" }],
      take: 80,
      include: { staff: { select: { name: true, title: true } } },
    }),
    db.user.findMany({
      where: { role: "TEACHER" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const draftTotal = records
    .filter((r) => r.status === "DRAFT")
    .reduce((sum, r) => sum + r.net, 0);
  const paidTotal = records
    .filter((r) => r.status === "PAID")
    .reduce((sum, r) => sum + r.net, 0);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Payroll"
        sub="Monthly salary records for staff — drafts become paid with one click."
        action={
          <div className="flex gap-2">
            <Badge tone="warning">₹{draftTotal.toLocaleString("en-IN")} draft</Badge>
            <Badge tone="success">₹{paidTotal.toLocaleString("en-IN")} paid</Badge>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card>
          <div className="px-6 pt-6">
            <CardHeader title="Salary records" className="!px-0 !pt-0" />
          </div>
          {records.length ? (
            <div className="overflow-x-auto px-2 pb-3 pt-3">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-ink-400">
                    <th className="px-4 py-2 font-bold">Staff</th>
                    <th className="px-4 py-2 font-bold">Month</th>
                    <th className="px-4 py-2 font-bold">Basic</th>
                    <th className="px-4 py-2 font-bold">+ Allow.</th>
                    <th className="px-4 py-2 font-bold">− Ded.</th>
                    <th className="px-4 py-2 font-bold">Net</th>
                    <th className="px-4 py-2 font-bold">Status</th>
                    <th className="px-4 py-2 font-bold" />
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="border-t border-line">
                      <td className="px-4 py-2.5">
                        <p className="text-[13px] font-bold text-ink-900">{r.staff.name}</p>
                        <p className="text-[11px] text-ink-400">{r.staff.title ?? ""}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-[12.5px] font-semibold text-ink-600">
                        {r.month}
                      </td>
                      <td className="px-4 py-2.5 text-[12.5px] text-ink-600">
                        ₹{r.basic.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-2.5 text-[12.5px] text-ink-600">
                        ₹{r.allowances.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-2.5 text-[12.5px] text-ink-600">
                        ₹{r.deductions.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-2.5 text-[13px] font-bold text-ink-900">
                        ₹{r.net.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge tone={TONE[r.status] ?? "neutral"}>
                          {r.status.toLowerCase()}
                          {r.paidOn ? ` · ${fmtDate(r.paidOn)}` : ""}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {r.status !== "PAID" && (
                          <form action={markPayrollPaidAction.bind(null, r.id)}>
                            <Button type="submit" size="sm">Mark paid</Button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No payroll yet" hint="Add a record from the form." icon={<Wallet size={20} />} />
          )}
        </Card>

        <Card className="h-fit p-6">
          <CardHeader title="Add / update record" sub="Unique per staff + month" className="!px-0 !pt-0" />
          <form action={addPayrollAction} className="mt-4 space-y-3">
            <div>
              <label className={labelCls} htmlFor="pr-staff">Staff member</label>
              <select id="pr-staff" name="staffId" className={inputCls} required>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="pr-month">Month</label>
              <input id="pr-month" name="month" type="month" defaultValue={thisMonth} required className={inputCls} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={labelCls} htmlFor="pr-basic">Basic</label>
                <input id="pr-basic" name="basic" type="number" min={1} required className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor="pr-allow">Allow.</label>
                <input id="pr-allow" name="allowances" type="number" min={0} defaultValue={0} className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor="pr-ded">Ded.</label>
                <input id="pr-ded" name="deductions" type="number" min={0} defaultValue={0} className={inputCls} />
              </div>
            </div>
            <Button type="submit">Save record</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
