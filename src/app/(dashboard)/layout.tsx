import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { countUnreadMessages } from "@/lib/db/crm";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  if (!session.emailVerified) redirect("/verify-email");
  if (session.role === "PENDING") redirect("/pending-approval");

  let unreadCount = 0;
  try {
    unreadCount = await countUnreadMessages(session.id);
  } catch {
    unreadCount = 0;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar showAdmin={session.role === "ADMIN"} unreadCount={unreadCount} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar name={session.name} role={session.role} unreadCount={unreadCount} />
        <main className="flex-1 p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:p-6 lg:pb-6">
          {children}
        </main>
        <MobileNav unreadCount={unreadCount} />
      </div>
    </div>
  );
}
