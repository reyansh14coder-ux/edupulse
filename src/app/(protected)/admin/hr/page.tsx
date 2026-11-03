import {
  BadgeCheck,
  Briefcase,
  IdCard,
  Star,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, Card, PageHeader } from "@/components/ui";

export const metadata = { title: "HRMS" };

const CARDS = [
  {
    href: "/admin/staff",
    label: "Staff profiles",
    hint: "Employee records, qualification, emergency contact",
    icon: IdCard,
    stat: async () => db.user.count({ where: { role: "TEACHER" } }),
    unit: "staff",
  },
  {
    href: "/admin/payroll",
    label: "Payroll",
    hint: "Monthly salary records, drafts and payouts",
    icon: Wallet,
    stat: async () => db.payrollRecord.count(),
    unit: "records",
  },
  {
    href: "/admin/appraisals",
    label: "Appraisals",
    hint: "Performance ratings, strengths, growth areas",
    icon: Star,
    stat: async () => db.appraisal.count(),
    unit: "reviews",
  },
  {
    href: "/admin/careers",
    label: "Careers",
    hint: "Vacancies and incoming applications",
    icon: Briefcase,
    stat: async () => db.vacancy.count({ where: { status: "OPEN" } }),
    unit: "open roles",
  },
];

export default async function AdminHrPage() {
  await requireSession(["ADMIN"]);
  const stats = await Promise.all(CARDS.map((c) => c.stat()));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="HRMS"
        sub="People operations — profiles, payroll, performance and hiring, all in one place."
        action={<Badge tone="brand"><BadgeCheck size={12} /> Human resources</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((c, i) => (
          <Link key={c.href} href={c.href} className="group">
            <Card className="h-full p-5 transition group-hover:-translate-y-0.5 group-hover:shadow-lg">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <c.icon size={18} />
              </span>
              <p className="mt-3 text-[14.5px] font-bold text-ink-900 group-hover:text-brand-700">
                {c.label}
              </p>
              <p className="mt-0.5 text-[12.5px] text-ink-500">{c.hint}</p>
              <p className="mt-3 text-[20px] font-bold text-ink-900">
                {stats[i]}{" "}
                <span className="text-[12px] font-semibold text-ink-400">{c.unit}</span>
              </p>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-6 p-6">
        <p className="text-[13.5px] leading-relaxed text-ink-600">
          Staff leave applications also land in{" "}
          <Link href="/admin/leave" className="font-bold text-brand-600 hover:underline">
            Leave requests
          </Link>{" "}
          alongside student leave — same approve/reject flow.
        </p>
      </Card>
    </div>
  );
}
