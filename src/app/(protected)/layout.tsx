import { requireSession } from "@/lib/auth";
import { AppShell } from "@/components/shell";

export const instant = false;

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  return (
    <AppShell
      name={session.name}
      email={session.email}
      role={session.role}
      title={session.title}
    >
      {children}
    </AppShell>
  );
}
