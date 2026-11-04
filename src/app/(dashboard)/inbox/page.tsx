import Link from "next/link";
import { getSessionUser } from "@/lib/firebase/session";
import {
  getMessage,
  getUsers,
  listMessages,
  listMessagesForUser,
} from "@/lib/db/crm";
import { canDeleteRecords } from "@/lib/rbac";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComposeMessageModal } from "@/components/inbox/compose-message-modal";
import { MessageDeleteButton } from "@/components/inbox/message-delete-button";
import { MarkReadButton } from "@/components/inbox/mark-read-button";
import { OpenMessageButton } from "@/components/inbox/open-message-button";

type Folder = "inbox" | "sent" | "unread" | "all";

function parseFolder(value?: string): Folder {
  if (value === "sent" || value === "unread" || value === "all") return value;
  return "inbox";
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string; id?: string }>;
}) {
  const session = await getSessionUser();
  if (!session) return null;

  const params = await searchParams;
  const folder = parseFolder(params.folder);
  const selectedId = params.id || null;
  const isAdmin = session.role === "ADMIN";
  const canDelete = canDeleteRecords(session);

  const users = await getUsers();
  const userMap = new Map(users.map((u) => [u.id, u]));
  const recipients = users
    .filter((u) => u.id !== session.id && u.role !== "PENDING")
    .map((u) => ({ id: u.id, name: `${u.name} (${u.role})` }));

  const messages =
    folder === "all" && isAdmin
      ? await listMessages()
      : await listMessagesForUser(session.id, {
          folder: folder === "all" ? "inbox" : folder,
        });

  const unreadCount = (
    await listMessagesForUser(session.id, { folder: "unread" })
  ).length;

  let visibleSelected = selectedId
    ? messages.find((m) => m.id === selectedId) || null
    : null;

  if (selectedId && !visibleSelected) {
    const fetched = await getMessage(selectedId);
    if (
      fetched &&
      (isAdmin ||
        fetched.toUserId === session.id ||
        fetched.fromUserId === session.id)
    ) {
      visibleSelected = fetched;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inbox"
        description="Internal team messages"
        actions={<ComposeMessageModal recipients={recipients} />}
      />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["inbox", "Inbox"],
            ["unread", `Unread${unreadCount ? ` (${unreadCount})` : ""}`],
            ["sent", "Sent"],
            ...(isAdmin ? ([["all", "All"]] as const) : []),
          ] as const
        ).map(([key, label]) => (
          <Link
            key={key}
            href={`/inbox?folder=${key}`}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              folder === key
                ? "bg-emerald-600 text-white"
                : "border border-slate-200 dark:border-slate-800"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              {folder === "sent"
                ? "Sent"
                : folder === "unread"
                  ? "Unread"
                  : folder === "all"
                    ? "All messages"
                    : "Inbox"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-0">
            {messages.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="No messages"
                  description="Compose a message to a teammate."
                />
              </div>
            ) : (
              messages.map((m) => {
                const peerId = folder === "sent" ? m.toUserId : m.fromUserId;
                const peer = userMap.get(peerId);
                const unread = m.toUserId === session.id && !m.readAt;
                const active = visibleSelected?.id === m.id;
                return (
                  <div
                    key={m.id}
                    className={`border-t border-slate-100 px-4 py-3 dark:border-slate-800 ${
                      active ? "bg-emerald-50 dark:bg-emerald-950/30" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p
                          className={`truncate text-sm ${
                            unread ? "font-semibold" : "font-medium"
                          }`}
                        >
                          {m.subject}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {folder === "sent" ? "To" : "From"}:{" "}
                          {peer?.name || "Unknown"} ·{" "}
                          {formatDateTime(m.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {unread ? <Badge variant="warning">New</Badge> : null}
                        <OpenMessageButton
                          id={m.id}
                          folder={folder}
                          isRecipient={m.toUserId === session.id}
                          unread={unread}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">
              {visibleSelected ? visibleSelected.subject : "Message"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!visibleSelected ? (
              <p className="text-sm text-slate-500">
                Select a message to read it here.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-slate-500">
                  <p>
                    From:{" "}
                    {userMap.get(visibleSelected.fromUserId)?.name || "Unknown"}
                  </p>
                  <p>
                    To:{" "}
                    {userMap.get(visibleSelected.toUserId)?.name || "Unknown"}
                  </p>
                  <p>{formatDateTime(visibleSelected.createdAt)}</p>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {visibleSelected.body}
                </p>
                <div className="flex flex-wrap gap-2">
                  {visibleSelected.toUserId === session.id &&
                  !visibleSelected.readAt ? (
                    <MarkReadButton id={visibleSelected.id} />
                  ) : null}
                  {canDelete ? (
                    <MessageDeleteButton
                      id={visibleSelected.id}
                      subject={visibleSelected.subject}
                    />
                  ) : null}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
