import {
  ArrowLeftRight,
  Bus,
  CalendarDays,
  ClipboardCheck,
  DoorOpen,
  GraduationCap,
  HeartPulse,
  Images,
  LifeBuoy,
  MessagesSquare,
  PlayCircle,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, Card, PageHeader } from "@/components/ui";

export const metadata = { title: "Operations" };

const CARDS = [
  { href: "/admin/leave", label: "Leave requests", hint: "Student & staff leave approvals", icon: CalendarDays },
  { href: "/admin/substitutions", label: "Substitutions", hint: "Cover classes when teachers are away", icon: ArrowLeftRight },
  { href: "/admin/lesson-plans", label: "Lesson plans", hint: "Review weekly teacher plans", icon: ClipboardCheck },
  { href: "/admin/transport", label: "Transport", hint: "Routes, buses and student assignments", icon: Bus },
  { href: "/admin/gallery", label: "Gallery", hint: "Photos students and parents see", icon: Images },
  { href: "/admin/visitors", label: "Front office", hint: "Visitor check-in / check-out", icon: DoorOpen },
  { href: "/admin/helpdesk", label: "Help desk", hint: "Tickets from students, parents, staff", icon: LifeBuoy },
  { href: "/admin/chat", label: "Messages", hint: "Direct messages and class announcements", icon: MessagesSquare },
  { href: "/admin/admissions", label: "Admissions", hint: "Enquiries and follow-ups", icon: UserPlus },
  { href: "/admin/surveys", label: "Surveys", hint: "Polls with live results", icon: GraduationCap },
  { href: "/admin/exams", label: "Competitive exams", hint: "Olympiads and scholarship tests", icon: GraduationCap },
  { href: "/admin/health", label: "Health & safety", hint: "Infirmary notes and incidents", icon: HeartPulse },
  { href: "/admin/resources", label: "Learning resources", hint: "Curated videos per chapter", icon: PlayCircle },
];

export default async function AdminOpsPage() {
  await requireSession(["ADMIN"]);
  const [pendingLeave, openTickets, newEnquiries, pendingPR] = await Promise.all([
    db.leaveRequest.count({ where: { status: "PENDING" } }),
    db.helpdeskTicket.count({ where: { status: "OPEN" } }),
    db.admissionEnquiry.count({ where: { status: "NEW" } }),
    db.purchaseRequest.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Operations"
        sub="Day-to-day school machinery — attendance-adjacent workflows, communication and campus life."
        action={
          <div className="flex flex-wrap gap-2">
            <Badge tone={pendingLeave ? "warning" : "neutral"}>{pendingLeave} leave</Badge>
            <Badge tone={openTickets ? "warning" : "neutral"}>{openTickets} tickets</Badge>
            <Badge tone={newEnquiries ? "info" : "neutral"}>{newEnquiries} enquiries</Badge>
            <Badge tone={pendingPR ? "warning" : "neutral"}>{pendingPR} PRs</Badge>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="group">
            <Card className="h-full p-5 transition group-hover:-translate-y-0.5 group-hover:shadow-lg">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <c.icon size={18} />
              </span>
              <p className="mt-3 text-[14px] font-bold text-ink-900 group-hover:text-brand-700">
                {c.label}
              </p>
              <p className="mt-0.5 text-[12.5px] text-ink-500">{c.hint}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
