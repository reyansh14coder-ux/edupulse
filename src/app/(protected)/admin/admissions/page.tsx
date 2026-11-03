import { UserPlus } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import {
  createAdmissionEnquiryAction,
  updateAdmissionStatusAction,
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

export const metadata = { title: "Admissions" };

const TONE: Record<string, "info" | "warning" | "success" | "danger" | "neutral"> = {
  NEW: "info",
  FOLLOW_UP: "warning",
  ADMITTED: "success",
  REJECTED: "danger",
};

export default async function AdminAdmissionsPage() {
  await requireSession(["ADMIN"]);
  const enquiries = await db.admissionEnquiry.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Admissions"
        sub="Enquiries from the website — track follow-ups and offers."
        action={
          <Badge tone="info">{enquiries.filter((e) => e.status === "NEW").length} new</Badge>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          {enquiries.length ? (
            <div className="divide-y divide-line">
              {enquiries.map((e) => (
                <div key={e.id} className="flex flex-wrap items-start justify-between gap-3 px-6 py-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={TONE[e.status] ?? "neutral"}>{e.status.toLowerCase()}</Badge>
                      <Badge tone="neutral">{e.grade}</Badge>
                    </div>
                    <p className="mt-1.5 text-[14px] font-bold text-ink-900">{e.name}</p>
                    <p className="text-[12.5px] text-ink-500">
                      {e.phone}
                      {e.email ? ` · ${e.email}` : ""} · {fmtDate(e.createdAt)}
                    </p>
                    {e.message && (
                      <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-ink-700">{e.message}</p>
                    )}
                  </div>
                  <form action={updateAdmissionStatusAction} className="flex items-center gap-1.5">
                    <input type="hidden" name="id" value={e.id} />
                    <select name="status" defaultValue={e.status} className="rounded-lg border border-line bg-card px-2 py-1.5 text-[12px] font-semibold text-ink-700">
                      <option value="NEW">New</option>
                      <option value="FOLLOW_UP">Follow up</option>
                      <option value="ADMITTED">Admitted</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                    <Button type="submit" size="sm" variant="outline">Update</Button>
                  </form>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No enquiries yet" hint="New admission enquiries appear here." icon={<UserPlus size={20} />} />
          )}
        </Card>

        <Card className="h-fit p-6">
          <CardHeader
            title="Log an offline enquiry"
            sub="Walk-in or phone enquiry, recorded manually"
            className="!px-0 !pt-0"
          />
          <form action={createAdmissionEnquiryAction} className="mt-4 space-y-3">
            <div>
              <label className={labelCls} htmlFor="ad-name">Guardian name</label>
              <input id="ad-name" name="name" required maxLength={120} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="ad-phone">Phone</label>
                <input id="ad-phone" name="phone" required maxLength={40} className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor="ad-grade">Grade</label>
                <input id="ad-grade" name="grade" required maxLength={40} placeholder="Class 6" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls} htmlFor="ad-email">Email</label>
              <input id="ad-email" name="email" type="email" maxLength={160} className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="ad-msg">Notes</label>
              <textarea id="ad-msg" name="message" rows={3} maxLength={800} className={inputCls} />
            </div>
            <Button type="submit">
              <UserPlus size={15} /> Add enquiry
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
