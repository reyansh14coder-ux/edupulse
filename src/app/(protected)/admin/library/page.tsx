import { BookOpen, Plus, Undo2 } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { addBookAction, issueBookAction, returnBookAction } from "@/app/actions/erp";
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

export const metadata = { title: "Library" };

const NOW = Date.now();

export default async function AdminLibraryPage() {
  await requireSession(["ADMIN"]);

  const [books, issues, students] = await Promise.all([
    db.libraryBook.findMany({ orderBy: { title: "asc" } }),
    db.bookIssue.findMany({
      orderBy: { issuedOn: "desc" },
      take: 40,
      include: {
        book: { select: { title: true, author: true } },
        student: {
          include: {
            user: { select: { name: true } },
            schoolClass: { select: { name: true } },
          },
        },
      },
    }),
    db.student.findMany({
      orderBy: { rollNo: "asc" },
      include: { user: { select: { name: true } }, schoolClass: { select: { name: true } } },
    }),
  ]);

  const active = issues.filter((i) => i.status !== "RETURNED");
  const overdue = active.filter(
    (i) => i.status === "OVERDUE" || i.dueOn.getTime() < NOW
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Library"
        sub="Catalogue, issues and returns. Availability updates the moment a book goes out or comes back."
        action={
          <div className="flex gap-2">
            <Badge tone="warning">{overdue.length} overdue</Badge>
            <Badge tone="info">{active.length} on loan</Badge>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <div className="px-6 pt-6">
              <CardHeader title="Catalogue" sub={`${books.length} titles`} className="!px-0 !pt-0" />
            </div>
            {books.length ? (
              <div className="overflow-x-auto px-2 pb-3 pt-3">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-ink-400">
                      <th className="px-4 py-2 font-bold">Title</th>
                      <th className="px-4 py-2 font-bold">Category</th>
                      <th className="px-4 py-2 font-bold">Shelf</th>
                      <th className="px-4 py-2 font-bold">Copies</th>
                      <th className="px-4 py-2 font-bold">Issue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.map((b) => (
                      <tr key={b.id} className="border-t border-line align-top">
                        <td className="px-4 py-2.5">
                          <p className="text-[13px] font-bold text-ink-900">{b.title}</p>
                          <p className="text-[11.5px] text-ink-400">{b.author}</p>
                        </td>
                        <td className="px-4 py-2.5 text-[12.5px] text-ink-600">{b.category}</td>
                        <td className="px-4 py-2.5 text-[12.5px] text-ink-500">{b.shelf ?? "—"}</td>
                        <td className="px-4 py-2.5">
                          <Badge tone={b.available > 0 ? "success" : "neutral"}>
                            {b.available}/{b.copies}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          {b.available > 0 ? (
                            <form action={issueBookAction} className="flex items-center gap-1.5">
                              <input type="hidden" name="bookId" value={b.id} />
                              <select name="studentId" className="max-w-[150px] rounded-lg border border-line bg-card px-2 py-1.5 text-[12px] font-semibold text-ink-700">
                                {students.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.user.name} ({s.schoolClass.name})
                                  </option>
                                ))}
                              </select>
                              <Button type="submit" size="sm">Issue</Button>
                            </form>
                          ) : (
                            <span className="text-[11.5px] font-semibold text-ink-400">all out</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No books yet" hint="Add the first title from the form." icon={<BookOpen size={20} />} />
            )}
          </Card>

          <Card>
            <div className="px-6 pt-6">
              <CardHeader title="Issues & returns" sub="Recent loans" className="!px-0 !pt-0" />
            </div>
            {issues.length ? (
              <div className="overflow-x-auto px-2 pb-3 pt-3">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-ink-400">
                      <th className="px-4 py-2 font-bold">Book</th>
                      <th className="px-4 py-2 font-bold">Student</th>
                      <th className="px-4 py-2 font-bold">Issued</th>
                      <th className="px-4 py-2 font-bold">Due</th>
                      <th className="px-4 py-2 font-bold">Status</th>
                      <th className="px-4 py-2 font-bold" />
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map((i) => (
                      <tr key={i.id} className="border-t border-line">
                        <td className="px-4 py-2.5 text-[12.5px] font-bold text-ink-800">
                          {i.book.title}
                        </td>
                        <td className="px-4 py-2.5 text-[12.5px] text-ink-600">
                          {i.student.user.name}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-[12.5px] text-ink-500">
                          {fmtDate(i.issuedOn)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-[12.5px] text-ink-500">
                          {fmtDate(i.dueOn)}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge
                            tone={
                              i.status === "RETURNED"
                                ? "success"
                                : i.status === "OVERDUE" || i.dueOn.getTime() < NOW
                                  ? "danger"
                                  : "info"
                            }
                          >
                            {i.status.toLowerCase()}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {i.status !== "RETURNED" && (
                            <form action={returnBookAction.bind(null, i.id)}>
                              <Button type="submit" size="sm" variant="outline">
                                <Undo2 size={13} /> Return
                              </Button>
                            </form>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No issues yet" hint="Issue a book from the catalogue above." icon={<Undo2 size={20} />} />
            )}
          </Card>
        </div>

        <Card className="h-fit p-6">
          <CardHeader title="Add a book" className="!px-0 !pt-0" />
          <form action={addBookAction} className="mt-4 space-y-3">
            <div>
              <label className={labelCls} htmlFor="bk-title">Title</label>
              <input id="bk-title" name="title" required maxLength={160} className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="bk-author">Author</label>
              <input id="bk-author" name="author" required maxLength={120} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="bk-cat">Category</label>
                <input id="bk-cat" name="category" defaultValue="General" maxLength={60} className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor="bk-shelf">Shelf</label>
                <input id="bk-shelf" name="shelf" placeholder="F-2" maxLength={20} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="bk-isbn">ISBN (optional)</label>
                <input id="bk-isbn" name="isbn" maxLength={40} className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor="bk-copies">Copies</label>
                <input id="bk-copies" name="copies" type="number" min={1} defaultValue={1} className={inputCls} />
              </div>
            </div>
            <Button type="submit">
              <Plus size={15} /> Add book
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
