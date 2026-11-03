import { Bus, Plus } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { addTransportRouteAction, assignStudentTransportAction } from "@/app/actions/erp";
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

export const metadata = { title: "Transport" };

export default async function AdminTransportPage() {
  await requireSession(["ADMIN"]);
  const [routes, students] = await Promise.all([
    db.transportRoute.findMany({
      include: {
        students: { include: { user: { select: { name: true } } } },
      },
      orderBy: { name: "asc" },
    }),
    db.student.findMany({
      orderBy: { rollNo: "asc" },
      include: {
        user: { select: { name: true } },
        schoolClass: { select: { name: true } },
        transportRoute: { select: { name: true } },
      },
    }),
  ]);
  const unassigned = students.filter((s) => !s.transportRouteId);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Transport"
        sub="Routes, buses and stops — assign students so parents can see the pick-up details."
        action={<Badge tone="info">{routes.length} routes</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {routes.map((r) => (
          <Card key={r.id} className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Bus size={16} />
                  </span>
                  <div>
                    <p className="text-[14.5px] font-bold text-ink-900">{r.name}</p>
                    <p className="text-[12px] text-ink-500">{r.busNo} · {r.driver}</p>
                  </div>
                </div>
              </div>
              <Badge tone="success">{r.students.length} riders</Badge>
            </div>
            <p className="mt-3 text-[12.5px] font-semibold text-ink-600">{r.timing}</p>
            {r.phone && <p className="text-[12px] text-ink-400">Driver: {r.phone}</p>}
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {r.stops.split("\n").filter(Boolean).map((stop) => (
                <li key={stop} className="rounded-full bg-surface px-2.5 py-1 text-[11.5px] font-semibold text-ink-600 ring-1 ring-line">
                  {stop}
                </li>
              ))}
            </ul>
            {r.students.length > 0 && (
              <p className="mt-3 text-[12.5px] text-ink-500">
                {r.students.slice(0, 8).map((s) => s.user.name).join(", ")}
                {r.students.length > 8 ? ` +${r.students.length - 8} more` : ""}
              </p>
            )}
          </Card>
        ))}
        {!routes.length && (
          <Card className="lg:col-span-2">
            <EmptyState title="No routes yet" hint="Add the first bus route from the form." icon={<Bus size={20} />} />
          </Card>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card className="h-fit p-6">
          <CardHeader title="New route" className="!px-0 !pt-0" />
          <form action={addTransportRouteAction} className="mt-4 space-y-3">
            <div>
              <label className={labelCls} htmlFor="tr-name">Route name</label>
              <input id="tr-name" name="name" required maxLength={120} placeholder="Route 3 — East Circuit" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="tr-bus">Bus number</label>
                <input id="tr-bus" name="busNo" required maxLength={40} className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor="tr-phone">Driver phone</label>
                <input id="tr-phone" name="phone" maxLength={40} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls} htmlFor="tr-driver">Driver</label>
              <input id="tr-driver" name="driver" required maxLength={120} className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="tr-timing">Timing</label>
              <input id="tr-timing" name="timing" required maxLength={160} placeholder="Pick-up 7:10 AM · Drop 3:40 PM" className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="tr-stops">Stops (one per line)</label>
              <textarea id="tr-stops" name="stops" required rows={4} maxLength={600} className={inputCls} />
            </div>
            <Button type="submit">
              <Plus size={15} /> Add route
            </Button>
          </form>
        </Card>

        <Card>
          <div className="px-6 pt-6">
            <CardHeader
              title="Student assignments"
              sub={`${unassigned.length} without a route`}
              className="!px-0 !pt-0"
            />
          </div>
          <div className="max-h-[520px] overflow-y-auto px-2 pb-3 pt-3">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-ink-400">
                  <th className="px-4 py-2 font-bold">Student</th>
                  <th className="px-4 py-2 font-bold">Class</th>
                  <th className="px-4 py-2 font-bold">Route</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-t border-line">
                    <td className="px-4 py-2 text-[13px] font-bold text-ink-800">{s.user.name}</td>
                    <td className="px-4 py-2 text-[12.5px] text-ink-500">{s.schoolClass.name}</td>
                    <td className="px-4 py-2">
                      <form action={assignStudentTransportAction} className="flex items-center gap-1.5">
                        <input type="hidden" name="studentId" value={s.id} />
                        <select
                          name="routeId"
                          defaultValue={s.transportRouteId ?? ""}
                          className="max-w-[190px] rounded-lg border border-line bg-card px-2 py-1.5 text-[12px] font-semibold text-ink-700"
                        >
                          <option value="">— none —</option>
                          {routes.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                        <Button type="submit" size="sm" variant="outline">Save</Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
