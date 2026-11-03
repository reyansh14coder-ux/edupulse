import { Store, Plus } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { addVendorAction } from "@/app/actions/erp";
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

export const metadata = { title: "Vendors" };

export default async function AdminVendorsPage() {
  await requireSession(["ADMIN"]);
  const vendors = await db.vendor.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Vendors"
        sub="Suppliers the school buys from — keep contacts and categories tidy."
        action={<Badge tone="info">{vendors.length} vendors</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {vendors.map((v) => (
            <Card key={v.id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Store size={16} />
                </span>
                <Badge tone={v.status === "ACTIVE" ? "success" : "neutral"}>
                  {v.status.toLowerCase()}
                </Badge>
              </div>
              <p className="mt-2 text-[14px] font-bold text-ink-900">{v.name}</p>
              <p className="text-[12.5px] text-ink-500">{v.category}</p>
              {v.phone && <p className="mt-1 text-[12px] text-ink-400">{v.phone}</p>}
            </Card>
          ))}
          {!vendors.length && (
            <Card className="sm:col-span-2 xl:col-span-3">
              <EmptyState title="No vendors yet" hint="Add the first supplier from the form." icon={<Store size={20} />} />
            </Card>
          )}
        </div>

        <Card className="h-fit p-6">
          <CardHeader title="Add vendor" className="!px-0 !pt-0" />
          <form action={addVendorAction} className="mt-4 space-y-3">
            <div>
              <label className={labelCls} htmlFor="vn-name">Name</label>
              <input id="vn-name" name="name" required maxLength={120} className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="vn-cat">Category</label>
              <input id="vn-cat" name="category" required maxLength={80} placeholder="Utilities" className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="vn-phone">Phone</label>
              <input id="vn-phone" name="phone" maxLength={40} className={inputCls} />
            </div>
            <Button type="submit">
              <Plus size={15} /> Add vendor
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
