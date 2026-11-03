import { PlayCircle, Plus } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { SUBJECTS } from "@/lib/question-bank";
import { addLearningResourceAction } from "@/app/actions/erp";
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

export const metadata = { title: "Learning resources" };

export default async function AdminResourcesPage() {
  await requireSession(["ADMIN"]);
  const resources = await db.learningResource.findMany({
    orderBy: [{ subject: "asc" }, { chapter: "asc" }],
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Learning resources"
        sub="Curated videos and links per chapter — students get them alongside their plan."
        action={<Badge tone="info">{resources.length} links</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {resources.map((r) => (
            <Card key={r.id} className="flex items-start justify-between gap-4 p-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand">{r.subject}</Badge>
                  <Badge tone="neutral">{r.kind.toLowerCase()}</Badge>
                </div>
                <p className="mt-1.5 text-[14px] font-bold text-ink-900">{r.title}</p>
                <p className="text-[12.5px] text-ink-500">{r.chapter}</p>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 break-all text-[12.5px] font-bold text-brand-600 hover:underline"
                >
                  <PlayCircle size={13} /> open resource
                </a>
              </div>
            </Card>
          ))}
          {!resources.length && (
            <Card>
              <EmptyState title="No resources yet" hint="Add the first chapter link from the form." icon={<PlayCircle size={20} />} />
            </Card>
          )}
        </div>

        <Card className="h-fit p-6">
          <CardHeader title="Add resource" className="!px-0 !pt-0" />
          <form action={addLearningResourceAction} className="mt-4 space-y-3">
            <div>
              <label className={labelCls} htmlFor="lr-subject">Subject</label>
              <select id="lr-subject" name="subject" className={inputCls} required>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="lr-chapter">Chapter</label>
              <input id="lr-chapter" name="chapter" required maxLength={160} className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="lr-title">Title</label>
              <input id="lr-title" name="title" required maxLength={200} className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="lr-url">URL</label>
              <input id="lr-url" name="url" type="url" required maxLength={600} className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="lr-kind">Kind</label>
              <select id="lr-kind" name="kind" className={inputCls}>
                <option value="VIDEO">Video</option>
                <option value="ARTICLE">Article</option>
                <option value="PRACTICE">Practice</option>
              </select>
            </div>
            <Button type="submit">
              <Plus size={15} /> Add resource
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
