import { Briefcase, Plus } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import {
  applyJobAction,
  createVacancyAction,
  updateApplicationStatusAction,
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

export const metadata = { title: "Careers" };

const TONE: Record<string, "info" | "warning" | "success" | "danger" | "neutral"> = {
  NEW: "info",
  SHORTLISTED: "warning",
  HIRED: "success",
  REJECTED: "danger",
};

export default async function AdminCareersPage() {
  await requireSession(["ADMIN"]);
  const [vacancies, applications] = await Promise.all([
    db.vacancy.findMany({
      orderBy: { createdAt: "desc" },
      include: { applications: true },
    }),
    db.jobApplication.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
      include: { vacancy: { select: { title: true, department: true } } },
    }),
  ]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Careers & recruitment"
        sub="Open positions and incoming applications — shortlist, hire or reject."
        action={
          <Badge tone="info">
            {vacancies.filter((v) => v.status === "OPEN").length} open roles
          </Badge>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {vacancies.map((v) => (
              <Card key={v.id} className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <Badge tone={v.status === "OPEN" ? "success" : "neutral"}>
                    {v.status.toLowerCase()}
                  </Badge>
                  <span className="text-[12px] font-bold text-ink-400">
                    {v.vacancies} position{v.vacancies > 1 ? "s" : ""}
                  </span>
                </div>
                <p className="mt-1.5 text-[14.5px] font-bold text-ink-900">{v.title}</p>
                <p className="text-[12.5px] text-ink-500">
                  {v.department}
                  {v.subjects ? ` · ${v.subjects}` : ""}
                </p>
                {v.description && (
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-600">{v.description}</p>
                )}
                <p className="mt-2 text-[12px] font-bold text-brand-600">
                  {v.applications.length} applications
                </p>
              </Card>
            ))}
            {!vacancies.length && (
              <Card className="md:col-span-2">
                <EmptyState title="No vacancies" hint="Post the first role from the form." icon={<Briefcase size={20} />} />
              </Card>
            )}
          </div>

          <Card>
            <div className="px-6 pt-6">
              <CardHeader title="Applications" className="!px-0 !pt-0" />
            </div>
            {applications.length ? (
              <div className="divide-y divide-line">
                {applications.map((a) => (
                  <div key={a.id} className="flex flex-wrap items-start justify-between gap-3 px-6 py-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={TONE[a.status] ?? "neutral"}>{a.status.toLowerCase()}</Badge>
                        <Badge tone="neutral">
                          {a.vacancy.title} · {a.vacancy.department}
                        </Badge>
                      </div>
                      <p className="mt-1.5 text-[14px] font-bold text-ink-900">{a.name}</p>
                      <p className="text-[12.5px] text-ink-500">
                        {a.phone}
                        {a.email ? ` · ${a.email}` : ""}
                      </p>
                      <p className="text-[12.5px] text-ink-500">
                        {a.qualification ?? "—"} · {a.experience ?? "—"} · {fmtDate(a.createdAt)}
                      </p>
                      {a.resumeNote && (
                        <p className="mt-1 max-w-xl text-[12.5px] leading-relaxed text-ink-600">
                          {a.resumeNote}
                        </p>
                      )}
                    </div>
                    <form action={updateApplicationStatusAction} className="flex items-center gap-1.5">
                      <input type="hidden" name="id" value={a.id} />
                      <select name="status" defaultValue={a.status} className="rounded-lg border border-line bg-card px-2 py-1.5 text-[12px] font-semibold text-ink-700">
                        <option value="NEW">New</option>
                        <option value="SHORTLISTED">Shortlisted</option>
                        <option value="HIRED">Hired</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                      <Button type="submit" size="sm" variant="outline">Update</Button>
                    </form>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No applications yet" hint="Candidates apply from the vacancy form." icon={<Briefcase size={20} />} />
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <CardHeader title="Post a vacancy" className="!px-0 !pt-0" />
            <form action={createVacancyAction} className="mt-4 space-y-3">
              <div>
                <label className={labelCls} htmlFor="vc-title">Title</label>
                <input id="vc-title" name="title" required maxLength={160} placeholder="TGT — Biology" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="vc-dept">Department</label>
                  <input id="vc-dept" name="department" required maxLength={120} placeholder="Science" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="vc-count">Openings</label>
                  <input id="vc-count" name="vacancies" type="number" min={1} defaultValue={1} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls} htmlFor="vc-subj">Subjects</label>
                <input id="vc-subj" name="subjects" maxLength={200} placeholder="Biology, General Science" className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor="vc-desc">Description</label>
                <textarea id="vc-desc" name="description" rows={3} maxLength={1200} className={inputCls} />
              </div>
              <Button type="submit">
                <Plus size={15} /> Post vacancy
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <CardHeader
              title="Submit an application"
              sub="For demo: applies to the first open vacancy"
              className="!px-0 !pt-0"
            />
            <form action={applyJobAction} className="mt-4 space-y-3">
              <div>
                <label className={labelCls} htmlFor="ja-vac">Vacancy</label>
                <select id="ja-vac" name="vacancyId" className={inputCls} required>
                  {vacancies.map((v) => (
                    <option key={v.id} value={v.id}>{v.title}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="ja-name">Name</label>
                  <input id="ja-name" name="name" required maxLength={120} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="ja-phone">Phone</label>
                  <input id="ja-phone" name="phone" required maxLength={40} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="ja-email">Email</label>
                  <input id="ja-email" name="email" type="email" maxLength={160} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="ja-exp">Experience</label>
                  <input id="ja-exp" name="experience" maxLength={80} placeholder="5 years" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls} htmlFor="ja-qual">Qualification</label>
                <input id="ja-qual" name="qualification" maxLength={200} className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor="ja-note">Resume note</label>
                <textarea id="ja-note" name="resumeNote" rows={2} maxLength={800} className={inputCls} />
              </div>
              <Button type="submit" variant="outline">Apply</Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
