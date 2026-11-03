import { Images, Plus } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { addGalleryPhotoAction } from "@/app/actions/erp";
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

export const metadata = { title: "Gallery" };

export default async function AdminGalleryPage() {
  await requireSession(["ADMIN"]);
  const photos = await db.galleryPhoto.findMany({ orderBy: { takenOn: "desc" } });
  const albums = [...new Set(photos.map((p) => p.album))];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Photo gallery"
        sub="School life, albums and events — every photo students and parents see on their side."
        action={<Badge tone="info">{photos.length} photos</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          {albums.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {albums.map((a) => (
                <span key={a} className="rounded-full bg-surface px-3 py-1 text-[12px] font-bold text-ink-600 ring-1 ring-line">
                  {a}
                </span>
              ))}
            </div>
          )}
          {photos.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {photos.map((p) => (
                <figure key={p.id} className="overflow-hidden rounded-2xl border border-line bg-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.title} className="h-44 w-full object-cover" loading="lazy" />
                  <figcaption className="p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[13px] font-bold text-ink-900">{p.title}</p>
                      <Badge tone="neutral">{p.album}</Badge>
                    </div>
                    {p.caption && (
                      <p className="mt-1 line-clamp-2 text-[12px] text-ink-500">{p.caption}</p>
                    )}
                    <p className="mt-1 text-[11px] text-ink-400">{fmtDate(p.takenOn)}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <Card>
              <EmptyState title="No photos yet" hint="Add the first photo from the form." icon={<Images size={20} />} />
            </Card>
          )}
        </div>

        <Card className="h-fit p-6">
          <CardHeader title="Add photo" className="!px-0 !pt-0" />
          <form action={addGalleryPhotoAction} className="mt-4 space-y-3">
            <div>
              <label className={labelCls} htmlFor="g-title">Title</label>
              <input id="g-title" name="title" required maxLength={160} className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="g-url">Image URL</label>
              <input
                id="g-url"
                name="url"
                required
                type="url"
                maxLength={600}
                placeholder="https://…"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="g-caption">Caption</label>
              <textarea id="g-caption" name="caption" rows={2} maxLength={300} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="g-album">Album</label>
                <input id="g-album" name="album" defaultValue="Events" maxLength={60} className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor="g-date">Taken on</label>
                <input id="g-date" name="takenOn" type="date" className={inputCls} />
              </div>
            </div>
            <Button type="submit">
              <Plus size={15} /> Add photo
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
