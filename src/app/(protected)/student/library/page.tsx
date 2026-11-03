import { BookOpen } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
} from "@/components/ui";

export const metadata = { title: "Library" };

const NOW = Date.now();

export default async function StudentLibraryPage() {
  const session = await requireSession(["STUDENT"]);
  const student = await db.student.findUnique({ where: { userId: session.sub } });
  const [books, myIssues] = await Promise.all([
    db.libraryBook.findMany({ orderBy: { title: "asc" } }),
    student
      ? db.bookIssue.findMany({
          where: { studentId: student.id },
          orderBy: { issuedOn: "desc" },
          include: { book: { select: { title: true, author: true } } },
        })
      : Promise.resolve([]),
  ]);
  const active = myIssues.filter((i) => i.status !== "RETURNED");

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Library"
        sub="Browse the catalogue and track the books on your card."
        action={
          <Badge tone={active.length ? "info" : "neutral"}>
            {active.length} on your card
          </Badge>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <div className="px-6 pt-6">
            <CardHeader title="Catalogue" sub={`${books.length} titles`} className="!px-0 !pt-0" />
          </div>
          {books.length ? (
            <div className="grid gap-3 px-6 pb-6 pt-4 sm:grid-cols-2">
              {books.map((b) => (
                <div key={b.id} className="rounded-xl border border-line p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13.5px] font-bold text-ink-900">{b.title}</p>
                    <Badge tone={b.available > 0 ? "success" : "neutral"}>
                      {b.available > 0 ? `${b.available} in` : "out"}
                    </Badge>
                  </div>
                  <p className="text-[12px] text-ink-500">{b.author}</p>
                  <p className="mt-1 text-[11.5px] text-ink-400">
                    {b.category} · shelf {b.shelf ?? "—"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Catalogue empty" hint="The librarian is still adding titles." icon={<BookOpen size={20} />} />
          )}
        </Card>

        <Card className="h-fit">
          <div className="px-6 pt-6">
            <CardHeader title="My books" className="!px-0 !pt-0" />
          </div>
          {myIssues.length ? (
            <ul className="divide-y divide-line px-2 pb-3 pt-2">
              {myIssues.map((i) => (
                <li key={i.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-bold text-ink-900">{i.book.title}</p>
                    <Badge
                      tone={
                        i.status === "RETURNED"
                          ? "success"
                          : i.dueOn.getTime() < NOW
                            ? "danger"
                            : "info"
                      }
                    >
                      {i.status.toLowerCase()}
                    </Badge>
                  </div>
                  <p className="text-[11.5px] text-ink-500">
                    issued {fmtDate(i.issuedOn)} · due {fmtDate(i.dueOn)}
                    {i.returnedOn ? ` · returned ${fmtDate(i.returnedOn)}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No books issued" hint="Ask the librarian to issue a title." icon={<BookOpen size={20} />} />
          )}
        </Card>
      </div>
    </div>
  );
}
