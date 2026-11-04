import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import {
  countUnreadMessages,
  getUsers,
  listMessagesForUser,
} from "@/lib/db/crm";
import { isUnreadFor, previewBody } from "@/lib/inbox";
import { formatDateTime } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { InboxPopup } from "@/components/inbox/inbox-popup";

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
  let popupItems: {
    id: string;
    subject: string;
    preview: string;
    fromName: string;
    when: string;
    unread: boolean;
  }[] = [];

  try {
    const [count, inboxMessages, users] = await Promise.all([
      countUnreadMessages(session.id),
      listMessagesForUser(session.id, { folder: "inbox" }),
      getUsers(),
    ]);
    unreadCount = count;
    const userMap = new Map(users.map((u) => [u.id, u]));
    popupItems = inboxMessages.slice(0, 8).map((m) => ({
      id: m.id,
      subject: m.subject,
      preview: previewBody(m.body, 80),
      fromName: userMap.get(m.fromUserId)?.name || "Unknown",
      when: formatDateTime(m.createdAt),
      unread: isUnreadFor(m, session.id),
    }));
  } catch {
    unreadCount = 0;
    popupItems = [];
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
        <InboxPopup unreadCount={unreadCount} items={popupItems} />
      </div>
    </div>
  );
}
