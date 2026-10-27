import { Trophy, Users } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  applyCompetitionAction,
  createCompetitionAction,
} from "@/app/actions/competitions";
import { logAudit } from "@/lib/audit";
import { fmtDate } from "@/lib/utils";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  inputCls,
  labelCls,
} from "@/components/ui";

export const metadata = { title: "Competitions" };

export default async function CompetitionsPage() {
  const session = await requireSession();
  const isStaff = session.role === "ADMIN" || session.role === "TEACHER";

  let studentId: string | null = null;
  if (session.role === "STUDENT") {
    const student = await db.student.findUnique({
      where: { userId: session.sub },
      select: { id: true },
    });
    studentId = student?.id ?? null;
  } else if (session.role === "PARENT") {
    const link = await db.parentLink.findFirst({
      where: { parentId: session.sub },
      select: { studentId: true },
    });
    studentId = link?.studentId ?? null;
  }

  const competitions = await db.competition.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      applications: {
        include: {
          student: {
            include: {
              user: { select: { name: true } },
              schoolClass: { select: { name: true, section: true } },
            },
          },
        },
        orderBy: { appliedAt: "asc" },
      },
    },
    take: 30,
  });

  const myApplications = new Set(
    studentId
      ? competitions
          .flatMap((c) => c.applications)
          .filter((a) => a.studentId === studentId)
          .map((a) => a.competitionId)
      : []
  );

  await logAudit("VIEW_COMPETITIONS", { detail: `${competitions.length} listed` });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Competitions"
        sub={
          isStaff
            ? "Announce contests — applications from students appear right here."
            : "Apply for school competitions; your teacher reviews every entry."
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {isStaff && (
          <Card className="h-fit p-6">
            <CardHeader
              title="Announce a competition"
              sub="Students and parents can apply from their side"
              className="!px-0 !pt-0"
            />
            <form action={createCompetitionAction} className="mt-4 space-y-4">
              <div>
                <label className={labelCls} htmlFor="c-title">Title</label>
                <input
                  id="c-title"
                  name="title"
                  required
                  maxLength={160}
                  placeholder="Inter-house Science Quiz 2026"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="c-body">Details</label>
                <textarea
                  id="c-body"
                  name="body"
                  required
                  rows={5}
                  maxLength={2000}
                  placeholder="Teams of two… open to Classes 6-10…"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="c-deadline">Last date to apply</label>
                <input id="c-deadline" name="deadline" type="date" className={inputCls} />
              </div>
              <Button type="submit">
                <Trophy size={15} /> Publish competition
              </Button>
            </form>
          </Card>
        )}

        <div className={isStaff ? "space-y-5 lg:col-span-2" : "space-y-5 lg:col-span-3"}>
          {competitions.map((c) => {
            const applied = myApplications.has(c.id);
            const closed = c.deadline ? c.deadline.getTime() < Date.now() : false;
            const canApply =
              (session.role === "STUDENT" || session.role === "PARENT") &&
              !!studentId;
            return (
              <Card key={c.id} className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-500/10 text-accent-500">
                      <Trophy size={18} />
                    </span>
                    <div>
                      <h3 className="font-display text-[16px] font-extrabold text-ink-900">
                        {c.title}
                      </h3>
                      <p className="mt-0.5 text-[12.5px] text-ink-500">
                        {c.authorName} · {fmtDate(c.createdAt)}
                        {c.deadline && (
                          <>
                            {" · Last date "}
                            <span className={closed ? "font-bold text-rose-500" : "font-bold text-ink-700"}>
                              {fmtDate(c.deadline)}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {applied && <Badge tone="success">Applied</Badge>}
                    {closed && <Badge tone="danger">Closed</Badge>}
                    {isStaff && (
                      <Badge tone="info" className="gap-1">
                        <Users size={11} /> {c.applications.length} applied
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-ink-700">
                  {c.body}
                </p>

                {canApply && !applied && !closed && (
                  <form
                    action={applyCompetitionAction}
                    className="mt-4 flex flex-wrap items-end gap-3 border-t border-line pt-4"
                  >
                    <input type="hidden" name="competitionId" value={c.id} />
                    <div className="min-w-[240px] flex-1">
                      <label className={labelCls} htmlFor={`note-${c.id}`}>
                        Why do you want to participate? (optional)
                      </label>
                      <input
                        id={`note-${c.id}`}
                        name="note"
                        maxLength={400}
                        placeholder="I want to represent my house…"
                        className={inputCls}
                      />
                    </div>
                    <Button type="submit">
                      Apply now
                    </Button>
                  </form>
                )}
                {applied && (
                  <p className="mt-3 rounded-xl border border-mint-200 bg-mint-500/5 px-4 py-2.5 text-[13px] font-semibold text-mint-600">
                    Your application is submitted. {isStaff ? "You can review it below." : "Your teacher will get back to you."}
                  </p>
                )}

                {isStaff && c.applications.length > 0 && (
                  <div className="mt-4 border-t border-line pt-4">
                    <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wider text-ink-400">
                      <Users size={12} /> Applicants
                    </p>
                    <ul className="mt-2.5 space-y-2">
                      {c.applications.map((a) => (
                        <li
                          key={a.id}
                          className="flex items-center gap-3 rounded-xl border border-line bg-surface/60 px-3.5 py-2.5"
                        >
                          <Avatar name={a.student.user.name} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-[13.5px] font-bold text-ink-900">
                              {a.student.user.name}
                            </p>
                            <p className="text-[12px] text-ink-500">
                              {a.student.schoolClass.name}
                              {a.student.schoolClass.section} · applied {fmtDate(a.appliedAt)}
                            </p>
                          </div>
                          {a.note && (
                            <p className="ml-auto hidden max-w-[45%] truncate text-[12.5px] italic text-ink-500 md:block">
                              “{a.note}”
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            );
          })}
          {!competitions.length && (
            <Card>
              <EmptyState
                title="No competitions announced yet"
                hint="School contests and olympiads will show up here."
                icon={<Trophy size={20} />}
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
