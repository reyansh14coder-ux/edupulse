import { Images } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "Gallery" };

export default async function StudentGalleryPage() {
  await requireSession(["STUDENT"]);
  const photos = await db.galleryPhoto.findMany({ orderBy: { takenOn: "desc" } });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="School gallery"
        sub="Sports, exhibitions and everyday moments from campus."
        action={<Badge tone="info">{photos.length} photos</Badge>}
      />

      {photos.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {photos.map((p) => (
            <figure key={p.id} className="overflow-hidden rounded-2xl border border-line bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.title} className="h-48 w-full object-cover" loading="lazy" />
              <figcaption className="p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[13.5px] font-bold text-ink-900">{p.title}</p>
                  <Badge tone="neutral">{p.album}</Badge>
                </div>
                {p.caption && (
                  <p className="mt-1 line-clamp-2 text-[12.5px] text-ink-500">{p.caption}</p>
                )}
                <p className="mt-1 text-[11.5px] text-ink-400">{fmtDate(p.takenOn)}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState title="No photos yet" hint="School photos will appear here." icon={<Images size={20} />} />
        </Card>
      )}
    </div>
  );
}
