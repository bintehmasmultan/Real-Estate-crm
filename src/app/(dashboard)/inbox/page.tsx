import Link from "next/link";
import {
  Archive,
  Inbox,
  Mail,
  MailOpen,
  Send,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import { getSessionUser } from "@/lib/firebase/session";
import {
  getMessage,
  getUsers,
  listContacts,
  listDeals,
  listLeads,
  listMessagesForUser,
  listProperties,
  listThreadMessages,
} from "@/lib/db/crm";
import { canDeleteRecords, getTeamAgentIds } from "@/lib/rbac";
import {
  isArchivedFor,
  isDeletedFor,
  isRecipient,
  isStarredFor,
  isUnreadFor,
  previewBody,
  searchMessages,
} from "@/lib/inbox";
import type { InboxFolder } from "@/lib/types";
import { formatDateTime, fullName } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ComposeMessageModal } from "@/components/inbox/compose-message-modal";
import { InboxListItem } from "@/components/inbox/inbox-list-item";
import { InboxMessageActions } from "@/components/inbox/inbox-message-actions";
import { EmptyTrashButton } from "@/components/inbox/empty-trash-button";

function parseFolder(value?: string): InboxFolder {
  if (
    value === "sent" ||
    value === "unread" ||
    value === "starred" ||
    value === "archive" ||
    value === "trash" ||
    value === "all"
  ) {
    return value;
  }
  return "inbox";
}

const FOLDER_META: {
  key: InboxFolder;
  label: string;
  icon: typeof Inbox;
  adminOnly?: boolean;
}[] = [
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "unread", label: "Unread", icon: Mail },
  { key: "starred", label: "Starred", icon: Star },
  { key: "sent", label: "Sent", icon: Send },
  { key: "archive", label: "Archive", icon: Archive },
  { key: "trash", label: "Trash", icon: Trash2 },
  { key: "all", label: "All mail", icon: Users, adminOnly: true },
];

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string; id?: string; q?: string }>;
}) {
  const session = await getSessionUser();
  if (!session) return null;

  const params = await searchParams;
  const folder = parseFolder(params.folder);
  const selectedId = params.id || null;
  const q = params.q?.trim() || "";
  const isAdmin = session.role === "ADMIN";
  const canHardDelete = canDeleteRecords(session);

  const agentIds = await getTeamAgentIds({
    id: session.id,
    role: session.role,
    teamId: session.teamId,
  });

  const [users, contacts, properties, deals, leads] = await Promise.all([
    getUsers(),
    listContacts(agentIds),
    listProperties(agentIds),
    listDeals(agentIds),
    listLeads(agentIds),
  ]);

  const userMap = new Map(users.map((u) => [u.id, u]));
  const recipients = users
    .filter((u) => u.id !== session.id && u.role !== "PENDING")
    .map((u) => ({ id: u.id, name: `${u.name} (${u.role})` }));

  const contactOpts = contacts.map((c) => ({
    id: c.id,
    name: fullName(c.firstName, c.lastName),
  }));
  const propertyOpts = properties.map((p) => ({ id: p.id, name: p.title }));
  const dealOpts = deals.map((d) => ({ id: d.id, name: d.title }));
  const leadOpts = leads.map((l) => ({
    id: l.id,
    name: fullName(l.firstName, l.lastName),
  }));

  let messages = await listMessagesForUser(session.id, {
    folder,
    isAdmin,
  });
  messages = searchMessages(messages, q, userMap);

  const unreadCount = (
    await listMessagesForUser(session.id, { folder: "unread" })
  ).length;
  const trashCount = (
    await listMessagesForUser(session.id, { folder: "trash" })
  ).length;

  let visibleSelected = selectedId
    ? messages.find((m) => m.id === selectedId) || null
    : null;

  if (selectedId && !visibleSelected) {
    const fetched = await getMessage(selectedId);
    if (
      fetched &&
      (isAdmin ||
        fetched.fromUserId === session.id ||
        fetched.toUserIds.includes(session.id))
    ) {
      visibleSelected = fetched;
    }
  }

  const thread = visibleSelected
    ? (await listThreadMessages(visibleSelected.threadId)).filter(
        (m) =>
          isAdmin ||
          m.fromUserId === session.id ||
          m.toUserIds.includes(session.id)
      )
    : [];

  const folderTitle =
    FOLDER_META.find((f) => f.key === folder)?.label || "Inbox";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Inbox"
        description="Team mail — compose, reply, star, archive, and search"
        actions={
          <ComposeMessageModal
            recipients={recipients}
            contacts={contactOpts}
            properties={propertyOpts}
            deals={dealOpts}
            leads={leadOpts}
          />
        }
      />

      <div className="grid gap-4 lg:grid-cols-12">
        <aside className="space-y-3 lg:col-span-3">
          <Card>
            <CardContent className="space-y-1 p-2">
              {FOLDER_META.filter((f) => !f.adminOnly || isAdmin).map((f) => {
                const Icon = f.icon;
                const active = folder === f.key;
                const count =
                  f.key === "unread"
                    ? unreadCount
                    : f.key === "trash"
                      ? trashCount
                      : null;
                return (
                  <Link
                    key={f.key}
                    href={q ? `/inbox?folder=${f.key}&q=${encodeURIComponent(q)}` : `/inbox?folder=${f.key}`}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      active
                        ? "bg-emerald-600 text-white"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{f.label}</span>
                    {count ? (
                      <span
                        className={`rounded-full px-1.5 text-[11px] font-medium ${
                          active
                            ? "bg-white/20 text-white"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {count}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          <form className="flex gap-2">
            <input type="hidden" name="folder" value={folder} />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Search mail…"
              className="bg-white dark:bg-slate-950"
            />
            <button
              type="submit"
              className="h-10 shrink-0 rounded-lg bg-slate-900 px-3 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
            >
              Search
            </button>
          </form>

          {folder === "trash" ? <EmptyTrashButton /> : null}
        </aside>

        <Card className="lg:col-span-4">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{folderTitle}</CardTitle>
            <span className="text-xs text-slate-500">
              {messages.length} message{messages.length === 1 ? "" : "s"}
            </span>
          </CardHeader>
          <CardContent className="max-h-[70vh] space-y-0 overflow-y-auto p-0">
            {messages.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="No messages"
                  description={
                    q
                      ? "Try a different search."
                      : folder === "sent"
                        ? "Messages you send appear here."
                        : "Compose a message to a teammate."
                  }
                />
              </div>
            ) : (
              messages.map((m) => {
                const unread = isUnreadFor(m, session.id);
                const starred = isStarredFor(m, session.id);
                const peerLabel =
                  folder === "sent"
                    ? `To: ${m.toUserIds
                        .map((id) => userMap.get(id)?.name || "Unknown")
                        .join(", ")}`
                    : `From: ${userMap.get(m.fromUserId)?.name || "Unknown"}`;
                return (
                  <InboxListItem
                    key={m.id}
                    id={m.id}
                    folder={folder}
                    subject={m.subject}
                    preview={previewBody(m.body)}
                    peerLabel={peerLabel}
                    when={formatDateTime(m.createdAt)}
                    unread={unread}
                    starred={starred}
                    active={visibleSelected?.id === m.id}
                    isRecipient={isRecipient(m, session.id)}
                  />
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-base">
              {visibleSelected ? visibleSelected.subject : "Message"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!visibleSelected ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-2 text-center">
                <MailOpen className="h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-500">
                  Select a message to read the conversation.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-950/50">
                  <p>
                    <span className="text-slate-500">From:</span>{" "}
                    {userMap.get(visibleSelected.fromUserId)?.name || "Unknown"}
                  </p>
                  <p>
                    <span className="text-slate-500">To:</span>{" "}
                    {visibleSelected.toUserIds
                      .map((id) => userMap.get(id)?.name || "Unknown")
                      .join(", ")}
                  </p>
                  <p>
                    <span className="text-slate-500">Date:</span>{" "}
                    {formatDateTime(visibleSelected.createdAt)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {isUnreadFor(visibleSelected, session.id) ? (
                      <Badge variant="warning">Unread</Badge>
                    ) : null}
                    {isStarredFor(visibleSelected, session.id) ? (
                      <Badge variant="info">Starred</Badge>
                    ) : null}
                    {isArchivedFor(visibleSelected, session.id) ? (
                      <Badge variant="secondary">Archived</Badge>
                    ) : null}
                    {isDeletedFor(visibleSelected, session.id) ? (
                      <Badge variant="danger">Trash</Badge>
                    ) : null}
                  </div>
                  {(visibleSelected.contactId ||
                    visibleSelected.propertyId ||
                    visibleSelected.dealId ||
                    visibleSelected.leadId) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {visibleSelected.contactId ? (
                        <Link
                          href={`/contacts/${visibleSelected.contactId}`}
                          className="rounded-md border px-2 py-1 text-xs hover:bg-white dark:hover:bg-slate-900"
                        >
                          Contact
                        </Link>
                      ) : null}
                      {visibleSelected.propertyId ? (
                        <Link
                          href={`/properties/${visibleSelected.propertyId}`}
                          className="rounded-md border px-2 py-1 text-xs hover:bg-white dark:hover:bg-slate-900"
                        >
                          Listing
                        </Link>
                      ) : null}
                      {visibleSelected.dealId ? (
                        <Link
                          href="/deals"
                          className="rounded-md border px-2 py-1 text-xs hover:bg-white dark:hover:bg-slate-900"
                        >
                          Deal
                        </Link>
                      ) : null}
                      {visibleSelected.leadId ? (
                        <Link
                          href="/leads"
                          className="rounded-md border px-2 py-1 text-xs hover:bg-white dark:hover:bg-slate-900"
                        >
                          Lead
                        </Link>
                      ) : null}
                    </div>
                  )}
                </div>

                <InboxMessageActions
                  messageId={visibleSelected.id}
                  folder={folder}
                  unread={isUnreadFor(visibleSelected, session.id)}
                  starred={isStarredFor(visibleSelected, session.id)}
                  archived={isArchivedFor(visibleSelected, session.id)}
                  inTrash={isDeletedFor(visibleSelected, session.id)}
                  canHardDelete={canHardDelete}
                  isRecipient={isRecipient(visibleSelected, session.id)}
                  replyDefaults={{
                    toUserIds: Array.from(
                      new Set(
                        [
                          visibleSelected.fromUserId,
                          ...visibleSelected.toUserIds,
                        ].filter((id) => id !== session.id)
                      )
                    ),
                    subject: visibleSelected.subject,
                    parentMessageId: visibleSelected.id,
                    contactId: visibleSelected.contactId,
                    propertyId: visibleSelected.propertyId,
                    dealId: visibleSelected.dealId,
                    leadId: visibleSelected.leadId,
                  }}
                  recipients={recipients}
                  contacts={contactOpts}
                  properties={propertyOpts}
                  deals={dealOpts}
                  leads={leadOpts}
                />

                <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Conversation ({thread.length})
                  </p>
                  {thread.map((m) => {
                    const mine = m.fromUserId === session.id;
                    return (
                      <div
                        key={m.id}
                        className={`rounded-xl border p-3 ${
                          m.id === visibleSelected.id
                            ? "border-emerald-300 dark:border-emerald-800"
                            : "border-slate-200 dark:border-slate-800"
                        } ${mine ? "bg-emerald-50/50 dark:bg-emerald-950/20" : ""}`}
                      >
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                          <span className="font-medium text-slate-700 dark:text-slate-200">
                            {userMap.get(m.fromUserId)?.name || "Unknown"}
                          </span>
                          <span>{formatDateTime(m.createdAt)}</span>
                        </div>
                        {m.id !== visibleSelected.id ? (
                          <p className="mb-1 text-xs font-medium text-slate-500">
                            {m.subject}
                          </p>
                        ) : null}
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {m.body}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
