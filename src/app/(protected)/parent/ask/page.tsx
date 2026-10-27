import { MessageCircleQuestion, Send } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { submitQueryAction } from "@/app/actions/queries";
import { fmtDate } from "@/lib/utils";
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

export const metadata = { title: "Ask a query" };

export default async function ParentAskPage() {
  const session = await requireSession(["PARENT"]);

  const queries = await db.parentQuery.findMany({
    where: { parentId: session.sub },
    orderBy: { createdAt: "desc" },
    include: { repliedBy: { select: { name: true, title: true } } },
    take: 40,
  });

  const link = await db.parentLink.findFirst({
    where: { parentId: session.sub },
    include: {
      student: {
        include: {
          user: { select: { name: true } },
          schoolClass: { select: { name: true, section: true } },
        },
      },
    },
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Ask a query"
        sub={
          link
            ? `Questions about ${link.student.user.name}'s studies, transport or school — sent straight to the teacher or principal.`
            : "Questions for the class teacher or principal."
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit p-6">
          <CardHeader
            title="New question"
            sub="Usually answered within a day"
            className="!px-0 !pt-0"
          />
          <form action={submitQueryAction} className="mt-4 space-y-4">
            <div>
              <label className={labelCls} htmlFor="q-recipient">Who should answer?</label>
              <select id="q-recipient" name="recipient" defaultValue="TEACHER" className={inputCls}>
                <option value="TEACHER">Class teacher</option>
                <option value="PRINCIPAL">Principal</option>
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="q-subject">Subject (optional)</label>
              <input
                id="q-subject"
                name="subject"
                maxLength={80}
                placeholder="Mathematics, Transport…"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="q-body">Your question</label>
              <textarea
                id="q-body"
                name="body"
                required
                rows={5}
                maxLength={1000}
                placeholder="How should my child revise algebra before the exam?"
                className={inputCls}
              />
            </div>
            <Button type="submit">
              <Send size={15} /> Send question
            </Button>
          </form>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          {queries.map((q) => (
            <Card key={q.id} className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                    <MessageCircleQuestion size={15} />
                  </span>
                  <Badge tone={q.recipient === "PRINCIPAL" ? "brand" : "info"}>
                    {q.recipient === "PRINCIPAL" ? "Principal" : "Class teacher"}
                  </Badge>
                  {q.subject && <Badge tone="neutral">{q.subject}</Badge>}
                </div>
                <span className="text-[12.5px] text-ink-500">{fmtDate(q.createdAt)}</span>
              </div>

              <p className="mt-3 text-[14px] leading-relaxed text-ink-800">{q.body}</p>

              {q.reply ? (
                <div className="mt-3 rounded-xl border border-mint-200 bg-mint-500/5 p-4">
                  <p className="text-[11.5px] font-bold uppercase tracking-wider text-mint-600">
                    Answered by {q.repliedBy?.name ?? "Staff"}
                    {q.repliedBy?.title ? ` · ${q.repliedBy.title}` : ""}
                  </p>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-700">{q.reply}</p>
                </div>
              ) : (
                <p className="mt-3 rounded-xl border border-line bg-surface/60 px-4 py-2.5 text-[13px] font-semibold text-ink-500">
                  {q.status === "CLOSED" ? "This question was closed." : "Waiting for a reply…"}
                </p>
              )}
            </Card>
          ))}
          {!queries.length && (
            <Card>
              <EmptyState
                title="No questions asked yet"
                hint="Use the form to ask the teacher or principal anything about your child."
                icon={<MessageCircleQuestion size={20} />}
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
