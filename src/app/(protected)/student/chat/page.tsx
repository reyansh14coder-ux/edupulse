import { MessagesSquare, Send } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { sendChatMessageAction } from "@/app/actions/erp";
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

export const metadata = { title: "Messages" };

export default async function StudentChatPage() {
  const session = await requireSession(["STUDENT"]);
  const [messages, staff] = await Promise.all([
    db.chatMessage.findMany({
      where: {
        OR: [{ fromId: session.sub }, { toId: session.sub }],
      },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: {
        from: { select: { name: true, role: true } },
        to: { select: { name: true, role: true } },
      },
    }),
    db.user.findMany({
      where: { role: { in: ["TEACHER", "ADMIN"] } },
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: { id: true, name: true, role: true, title: true },
    }),
  ]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Messages"
        sub="A quick line to your teachers or the principal."
        action={<Badge tone="info">{messages.length} messages</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="p-6">
          {messages.length ? (
            <ul className="space-y-4">
              {messages.map((m) => (
                <li
                  key={m.id}
                  className={
                    m.fromId === session.sub
                      ? "ml-auto max-w-xl rounded-2xl rounded-br-md bg-brand-600 px-4 py-3 text-white"
                      : "max-w-xl rounded-2xl rounded-bl-md bg-surface px-4 py-3 ring-1 ring-line"
                  }
                >
                  <p
                    className={`text-[11px] font-bold uppercase tracking-wider ${
                      m.fromId === session.sub ? "text-brand-100" : "text-ink-400"
                    }`}
                  >
                    {m.from.name} · {fmtDate(m.createdAt)}
                  </p>
                  <p
                    className={`mt-1 text-[13.5px] leading-relaxed ${
                      m.fromId === session.sub ? "text-white" : "text-ink-800"
                    }`}
                  >
                    {m.body}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No messages yet"
              hint="Say hello to your class teacher from the form."
              icon={<MessagesSquare size={20} />}
            />
          )}
        </Card>

        <Card className="h-fit p-6">
          <CardHeader title="New message" className="!px-0 !pt-0" />
          <form action={sendChatMessageAction} className="mt-4 space-y-3">
            <div>
              <label className={labelCls} htmlFor="sc-to">To</label>
              <select id="sc-to" name="toId" className={inputCls} required>
                {staff.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.role === "ADMIN" ? "Principal" : (p.title ?? "Teacher")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="sc-body">Message</label>
              <textarea id="sc-body" name="body" required rows={4} maxLength={800} className={inputCls} />
            </div>
            <Button type="submit">
              <Send size={15} /> Send
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
