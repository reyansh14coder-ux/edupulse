import { BookOpen, Mail, Users } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Avatar, Badge, Card, PageHeader } from "@/components/ui";

export const metadata = { title: "Teachers" };

export default async function AdminTeachersPage() {
  await requireSession(["ADMIN"]);

  const teachers = await db.user.findMany({
    where: { role: "TEACHER" },
    include: {
      teaching: {
        include: {
          schoolClass: { include: { students: { select: { id: true } } } },
        },
      },
      homeworks: { take: 1, orderBy: { assignedOn: "desc" } },
      counseling: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Teachers"
        sub={`${teachers.length} teaching staff · subject & class assignments`}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teachers.map((t) => {
          const classes = [...new Set(t.teaching.map((a) => `${a.schoolClass.name} ${a.schoolClass.section}`))];
          const subjects = [...new Set(t.teaching.map((a) => a.subject))];
          const students = new Set(
            t.teaching.flatMap((a) => a.schoolClass.students.map((s) => s.id))
          ).size;
          return (
            <Card key={t.id} className="p-5 transition hover:-translate-y-0.5 hover:shadow-pop/40">
              <div className="flex items-start gap-3.5">
                <Avatar name={t.name} size="lg" />
                <div className="min-w-0">
                  <p className="font-display text-[15.5px] font-extrabold text-ink-900">
                    {t.name}
                  </p>
                  <p className="text-[12.5px] text-ink-500">{t.title ?? "Teacher"}</p>
                  <a
                    href={`mailto:${t.email}`}
                    className="mt-1 flex items-center gap-1.5 text-[12.5px] text-ink-400 hover:text-brand-600"
                  >
                    <Mail size={12} /> {t.email}
                  </a>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {subjects.map((s) => (
                  <Badge key={s} tone="brand">
                    {s}
                  </Badge>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
                <div>
                  <p className="font-display text-lg font-extrabold text-ink-900">
                    {classes.length}
                  </p>
                  <p className="text-[10.5px] font-bold uppercase tracking-wide text-ink-400">
                    Classes
                  </p>
                </div>
                <div>
                  <p className="font-display text-lg font-extrabold text-ink-900">{students}</p>
                  <p className="text-[10.5px] font-bold uppercase tracking-wide text-ink-400">
                    Students
                  </p>
                </div>
                <div>
                  <p className="font-display text-lg font-extrabold text-ink-900">
                    {t.counseling.length}
                  </p>
                  <p className="text-[10.5px] font-bold uppercase tracking-wide text-ink-400">
                    Sessions
                  </p>
                </div>
              </div>

              <p className="mt-3 flex items-center gap-1.5 text-[12px] text-ink-500">
                <Users size={12} className="text-ink-400" />
                {classes.join(" · ")}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-500">
                <BookOpen size={12} className="text-ink-400" />
                Last activity:{" "}
                {t.homeworks[0]
                  ? new Date(t.homeworks[0].assignedOn).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })
                  : "—"}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
