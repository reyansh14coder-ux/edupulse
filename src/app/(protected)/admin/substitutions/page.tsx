import { ArrowLeftRight, Plus } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { createSubstitutionAction } from "@/app/actions/erp";
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

export const metadata = { title: "Substitutions" };

export default async function AdminSubstitutionsPage() {
  await requireSession(["ADMIN"]);
  const [subs, classes, teachers] = await Promise.all([
    db.substitution.findMany({
      orderBy: { date: "desc" },
      take: 60,
      include: {
        schoolClass: { select: { name: true, section: true } },
        originalTeacher: { select: { name: true } },
        substituteTeacher: { select: { name: true } },
      },
    }),
    db.schoolClass.findMany({ orderBy: { name: "asc" } }),
    db.user.findMany({
      where: { role: "TEACHER" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Substitutions"
        sub="Cover a class when its teacher is away — both teachers see it on their timetable."
        action={<Badge tone="info">{subs.length} records</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          {subs.length ? (
            <div className="divide-y divide-line">
              {subs.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="warning">period {s.period}</Badge>
                      <Badge tone="neutral">
                        {s.schoolClass.name} {s.schoolClass.section}
                      </Badge>
                      <Badge tone="info">{s.subject}</Badge>
                    </div>
                    <p className="mt-1.5 text-[13.5px] font-bold text-ink-900">
                      {s.originalTeacher.name} → {s.substituteTeacher.name}
                    </p>
                    {s.reason && (
                      <p className="text-[12.5px] text-ink-500">{s.reason}</p>
                    )}
                  </div>
                  <p className="whitespace-nowrap text-[13px] font-semibold text-ink-600">
                    {fmtDate(s.date)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No substitutions yet"
              hint="Create one from the form — for a teacher on leave or a swapped period."
              icon={<ArrowLeftRight size={20} />}
            />
          )}
        </Card>

        <Card className="h-fit p-6">
          <CardHeader title="New substitution" className="!px-0 !pt-0" />
          <form action={createSubstitutionAction} className="mt-4 space-y-3">
            <div>
              <label className={labelCls} htmlFor="sub-class">Class</label>
              <select id="sub-class" name="classId" className={inputCls} required>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="sub-date">Date</label>
                <input id="sub-date" name="date" type="date" required className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor="sub-period">Period</label>
                <select id="sub-period" name="period" className={inputCls}>
                  {Array.from({ length: 8 }, (_, i) => i + 1).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls} htmlFor="sub-subject">Subject</label>
              <input id="sub-subject" name="subject" required maxLength={80} placeholder="Science" className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="sub-orig">Original teacher</label>
              <select id="sub-orig" name="originalTeacherId" className={inputCls} required>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="sub-rep">Substitute teacher</label>
              <select id="sub-rep" name="substituteTeacherId" className={inputCls} required>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="sub-reason">Reason</label>
              <input id="sub-reason" name="reason" maxLength={300} placeholder="Medical leave" className={inputCls} />
            </div>
            <Button type="submit">
              <Plus size={15} /> Assign substitute
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
