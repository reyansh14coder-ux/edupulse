import { PackageCheck, Plus } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { createPurchaseRequestAction, reviewPurchaseAction } from "@/app/actions/erp";
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

export const metadata = { title: "Procurement" };

const TONE: Record<string, "warning" | "success" | "danger" | "neutral"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

const CATEGORIES = [
  "Salaries",
  "Utilities",
  "Transport",
  "Maintenance",
  "Library & Labs",
  "Events & Activities",
];

export default async function AdminProcurementPage() {
  await requireSession(["ADMIN"]);
  const requests = await db.purchaseRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  const pending = requests.filter((r) => r.status === "PENDING");

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Procurement"
        sub="Purchase requests from staff — approve big buys before they hit the budget."
        action={<Badge tone={pending.length ? "warning" : "neutral"}>{pending.length} pending</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          {requests.length ? (
            <div className="divide-y divide-line">
              {requests.map((r) => (
                <div key={r.id} className="flex flex-wrap items-start justify-between gap-3 px-6 py-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={TONE[r.status] ?? "neutral"}>{r.status.toLowerCase()}</Badge>
                      <Badge tone="neutral">{r.category}</Badge>
                    </div>
                    <p className="mt-1.5 text-[14px] font-bold text-ink-900">{r.title}</p>
                    <p className="text-[12.5px] text-ink-500">
                      ₹{r.amount.toLocaleString("en-IN")} · by {r.requestedByName || "staff"} ·{" "}
                      {fmtDate(r.createdAt)}
                    </p>
                  </div>
                  {r.status === "PENDING" && (
                    <div className="flex gap-2">
                      <form action={reviewPurchaseAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value="APPROVED" />
                        <Button type="submit" size="sm">Approve</Button>
                      </form>
                      <form action={reviewPurchaseAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value="REJECTED" />
                        <Button type="submit" size="sm" variant="outline">Reject</Button>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No purchase requests" hint="Staff raise requests from their dashboard." icon={<PackageCheck size={20} />} />
          )}
        </Card>

        <Card className="h-fit p-6">
          <CardHeader title="New request" className="!px-0 !pt-0" />
          <form action={createPurchaseRequestAction} className="mt-4 space-y-3">
            <div>
              <label className={labelCls} htmlFor="pq-title">What to buy</label>
              <input id="pq-title" name="title" required maxLength={200} placeholder="10 new lab microscopes" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="pq-cat">Category</label>
                <select id="pq-cat" name="category" className={inputCls} required>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="pq-amt">Amount (₹)</label>
                <input id="pq-amt" name="amount" type="number" min={1} required className={inputCls} />
              </div>
            </div>
            <Button type="submit">
              <Plus size={15} /> Submit request
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
