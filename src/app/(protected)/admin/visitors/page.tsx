import { DoorOpen, LogOut } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { visitorCheckInAction, visitorCheckOutAction } from "@/app/actions/erp";
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

export const metadata = { title: "Front office" };

export default async function AdminVisitorsPage() {
  await requireSession(["ADMIN"]);
  const visitors = await db.visitorLog.findMany({ orderBy: { inTime: "desc" }, take: 80 });
  const inside = visitors.filter((v) => v.status === "INSIDE");

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Front office — visitor log"
        sub="Who's on campus right now, and who visited recently."
        action={
          <Badge tone={inside.length ? "warning" : "neutral"}>
            {inside.length} inside
          </Badge>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          {visitors.length ? (
            <div className="overflow-x-auto px-2 pb-3 pt-3">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-ink-400">
                    <th className="px-4 py-2 font-bold">Visitor</th>
                    <th className="px-4 py-2 font-bold">Purpose</th>
                    <th className="px-4 py-2 font-bold">Host</th>
                    <th className="px-4 py-2 font-bold">In</th>
                    <th className="px-4 py-2 font-bold">Out</th>
                    <th className="px-4 py-2 font-bold" />
                  </tr>
                </thead>
                <tbody>
                  {visitors.map((v) => (
                    <tr key={v.id} className="border-t border-line">
                      <td className="px-4 py-2.5">
                        <p className="text-[13px] font-bold text-ink-900">{v.name}</p>
                        <p className="text-[11.5px] text-ink-400">{v.phone ?? "—"}</p>
                      </td>
                      <td className="px-4 py-2.5 text-[12.5px] text-ink-600">{v.purpose}</td>
                      <td className="px-4 py-2.5 text-[12.5px] text-ink-500">{v.host}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-[12.5px] text-ink-500">
                        {fmtDate(v.inTime)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-[12.5px] text-ink-500">
                        {v.outTime ? fmtDate(v.outTime) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Badge tone={v.status === "INSIDE" ? "warning" : "neutral"}>
                            {v.status.toLowerCase()}
                          </Badge>
                          {v.status === "INSIDE" && (
                            <form action={visitorCheckOutAction.bind(null, v.id)}>
                              <Button type="submit" size="sm" variant="outline">
                                <LogOut size={13} /> Out
                              </Button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No visitors logged" hint="Check someone in from the form." icon={<DoorOpen size={20} />} />
          )}
        </Card>

        <Card className="h-fit p-6">
          <CardHeader title="Check in a visitor" className="!px-0 !pt-0" />
          <form action={visitorCheckInAction} className="mt-4 space-y-3">
            <div>
              <label className={labelCls} htmlFor="v-name">Name</label>
              <input id="v-name" name="name" required maxLength={120} className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="v-phone">Phone</label>
              <input id="v-phone" name="phone" maxLength={40} className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="v-purpose">Purpose</label>
              <input
                id="v-purpose"
                name="purpose"
                required
                maxLength={300}
                placeholder="Admission enquiry"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="v-host">Meeting with</label>
              <input id="v-host" name="host" maxLength={120} placeholder="Principal" defaultValue="Front Office" className={inputCls} />
            </div>
            <Button type="submit">
              <DoorOpen size={15} /> Check in
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
