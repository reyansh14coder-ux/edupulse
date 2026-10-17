import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { MarksEntry } from "@/components/marks-entry";
import { Card, PageHeader, EmptyState } from "@/components/ui";

export const metadata = { title: "Marks entry" };

export default async function TeacherMarksPage() {
  const session = await requireSession(["TEACHER"]);

  const assignments = await db.teacherAssignment.findMany({
    where: { teacherId: session.sub },
    include: { schoolClass: { include: { students: { orderBy: { rollNo: "asc" }, include: { user: { select: { name: true } } } } } } },
    orderBy: { schoolClass: { name: "asc" } },
  });
  if (!assignments.length) notFound();

  const byClass = new Map<
    string,
    { label: string; subjects: Set<string>; students: { id: string; name: string; roll: number }[] }
  >();
  for (const a of assignments) {
    const entry = byClass.get(a.classId) ?? {
      label: `${a.schoolClass.name} ${a.schoolClass.section}`,
      subjects: new Set<string>(),
      students: a.schoolClass.students.map((s) => ({
        id: s.id,
        name: s.user.name,
        roll: s.rollNo,
      })),
    };
    entry.subjects.add(a.subject);
    byClass.set(a.classId, entry);
  }

  const classes = [...byClass.entries()].map(([id, e]) => ({
    id,
    label: e.label,
    subjects: [...e.subjects],
    students: e.students,
  }));

  const classIds = classes.map((c) => c.id);
  const subjects = [...new Set(classes.flatMap((c) => c.subjects))];

  const assessments = await db.assessment.findMany({
    where: { classId: { in: classIds }, subject: { in: subjects } },
    orderBy: { date: "desc" },
    take: 80,
  });

  const scores = await db.score.findMany({
    where: { assessmentId: { in: assessments.map((a) => a.id) } },
    select: { assessmentId: true, studentId: true, marks: true },
  });
  const scoreMap: Record<string, Record<string, number>> = {};
  for (const s of scores) {
    (scoreMap[s.assessmentId] ??= {})[s.studentId] = s.marks;
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Marks entry"
        sub="Record results for tests, exams and homework reviews — or update existing assessments."
      />

      <Card className="overflow-hidden">
        {classes.length ? (
          <MarksEntry
            classes={classes}
            assessments={assessments.map((a) => ({
              id: a.id,
              classId: a.classId,
              subject: a.subject,
              title: a.title,
              type: a.type,
              maxMarks: a.maxMarks,
              date: a.date.toISOString().slice(0, 10),
            }))}
            scoreMap={scoreMap}
          />
        ) : (
          <EmptyState
            title="No classes assigned"
            hint="Ask the school admin to assign you to a class and subject from Academic setup."
          />
        )}
      </Card>
    </div>
  );
}
