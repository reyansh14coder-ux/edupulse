import {
  BarChart3,
  Images,
  MessagesSquare,
  PlayCircle,
} from "lucide-react";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, Card, PageHeader } from "@/components/ui";

export const metadata = { title: "School life" };

export default async function StudentSchoolPage() {
  await requireSession(["STUDENT"]);
  const [photoCount, resourceCount, openSurveys] = await Promise.all([
    db.galleryPhoto.count(),
    db.learningResource.count(),
    db.survey.count(),
  ]);

  const CARDS = [
    { href: "/student/survey", label: "Surveys", hint: "Vote in school polls", icon: BarChart3, stat: openSurveys },
    { href: "/student/gallery", label: "Gallery", hint: "Campus photos & events", icon: Images, stat: photoCount },
    { href: "/student/resources", label: "Resources", hint: "Videos for your chapters", icon: PlayCircle, stat: resourceCount },
    { href: "/student/chat", label: "Messages", hint: "Talk to your teachers", icon: MessagesSquare, stat: null },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="School life"
        sub="Everything beyond classes — polls, photos, extra learning and messages."
        action={<Badge tone="brand">Student extras</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="group">
            <Card className="h-full p-5 transition group-hover:-translate-y-0.5 group-hover:shadow-lg">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <c.icon size={18} />
              </span>
              <p className="mt-3 text-[14.5px] font-bold text-ink-900 group-hover:text-brand-700">
                {c.label}
              </p>
              <p className="mt-0.5 text-[12.5px] text-ink-500">{c.hint}</p>
              {c.stat !== null && (
                <p className="mt-3 text-[20px] font-bold text-ink-900">
                  {c.stat}{" "}
                  <span className="text-[12px] font-semibold text-ink-400">items</span>
                </p>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
