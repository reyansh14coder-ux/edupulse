import { IdCard } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { upsertStaffProfileAction } from "@/app/actions/erp";
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

export const metadata = { title: "Staff profiles" };

export default async function AdminStaffPage() {
  await requireSession(["ADMIN"]);
  const staff = await db.user.findMany({
    where: { role: { in: ["TEACHER", "ADMIN"] } },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    include: { staffProfile: true },
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Staff profiles"
        sub="Employee records — qualification, experience and emergency contact."
        action={<Badge tone="info">{staff.length} staff</Badge>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {staff.map((s) => {
          const p = s.staffProfile;
          return (
            <Card key={s.id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[14.5px] font-bold text-ink-900">{s.name}</p>
                  <p className="text-[12.5px] text-ink-500">{s.title ?? s.role.toLowerCase()}</p>
                </div>
                <Badge tone={s.role === "ADMIN" ? "brand" : "info"}>
                  {p?.employeeId ?? s.role.toLowerCase()}
                </Badge>
              </div>
              <dl className="mt-3 space-y-1.5 text-[12.5px]">
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-400">Qualification</dt>
                  <dd className="text-right font-semibold text-ink-700">{p?.qualification ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-400">Experience</dt>
                  <dd className="text-right font-semibold text-ink-700">{p?.experience ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-400">Joined</dt>
                  <dd className="text-right font-semibold text-ink-700">
                    {p?.joinedOn ? fmtDate(p.joinedOn) : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-400">Emergency</dt>
                  <dd className="text-right font-semibold text-ink-700">{p?.emergencyPhone ?? "—"}</dd>
                </div>
              </dl>
              {p?.bio && (
                <p className="mt-2 text-[12.5px] leading-relaxed text-ink-600">{p.bio}</p>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 p-6">
        <CardHeader
          title="Update a profile"
          sub="Creates the profile if the staff member doesn't have one yet."
          className="!px-0 !pt-0"
        />
        <form action={upsertStaffProfileAction} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label className={labelCls} htmlFor="sp-user">Staff member</label>
            <select id="sp-user" name="userId" className={inputCls} required>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="sp-eid">Employee ID</label>
            <input id="sp-eid" name="employeeId" maxLength={40} placeholder="EMP-101" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="sp-qual">Qualification</label>
            <input id="sp-qual" name="qualification" maxLength={200} placeholder="M.Sc., B.Ed." className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="sp-exp">Experience</label>
            <input id="sp-exp" name="experience" maxLength={80} placeholder="8 years" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="sp-joined">Joined on</label>
            <input id="sp-joined" name="joinedOn" type="date" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="sp-emg">Emergency phone</label>
            <input id="sp-emg" name="emergencyPhone" maxLength={40} className={inputCls} />
          </div>
          <div className="md:col-span-2 xl:col-span-3">
            <label className={labelCls} htmlFor="sp-bio">Bio</label>
            <textarea id="sp-bio" name="bio" rows={2} maxLength={1000} className={inputCls} />
          </div>
          <div>
            <Button type="submit">
              <IdCard size={15} /> Save profile
            </Button>
          </div>
        </form>
      </Card>
      {!staff.length && (
        <Card className="mt-6">
          <EmptyState title="No staff yet" hint="Create teachers from the Teachers page first." icon={<IdCard size={20} />} />
        </Card>
      )}
    </div>
  );
}
