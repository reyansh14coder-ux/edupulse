import { PlayCircle } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "Resources" };

export default async function StudentResourcesPage() {
  await requireSession(["STUDENT"]);
  const resources = await db.learningResource.findMany({
    orderBy: [{ subject: "asc" }, { chapter: "asc" }],
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Learning resources"
        sub="Teacher-picked videos and links for your chapters."
        action={<Badge tone="info">{resources.length} links</Badge>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {resources.map((r) => (
          <Card key={r.id} className="flex flex-col p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">{r.subject}</Badge>
              <Badge tone="neutral">{r.kind.toLowerCase()}</Badge>
            </div>
            <p className="mt-2 text-[14px] font-bold text-ink-900">{r.title}</p>
            <p className="mt-0.5 flex-1 text-[12.5px] text-ink-500">{r.chapter}</p>
            <a
              href={r.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-600 hover:underline"
            >
              <PlayCircle size={14} /> Watch / open
            </a>
          </Card>
        ))}
        {!resources.length && (
          <Card className="md:col-span-2 xl:col-span-3">
            <EmptyState title="No resources yet" hint="Your teachers will add links soon." icon={<PlayCircle size={20} />} />
          </Card>
        )}
      </div>
    </div>
  );
}
