import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { AppShell } from "@/components/layout/app-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  if (session.role === "PENDING") redirect("/pending-approval");

  return (
    <AppShell
      name={session.name}
      role={session.role}
      showAdmin={session.role === "ADMIN"}
    >
      {children}
    </AppShell>
  );
}
