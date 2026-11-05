import type { InboxFolder, TeamMessage } from "@/lib/types";

/** Normalize legacy 1:1 messages into the multi-recipient mailbox shape. */
export function normalizeMessage(raw: TeamMessage): TeamMessage {
  const toUserIds =
    Array.isArray(raw.toUserIds) && raw.toUserIds.length > 0
      ? Array.from(new Set(raw.toUserIds.filter(Boolean)))
      : raw.toUserId
        ? [raw.toUserId]
        : [];

  const toUserId = raw.toUserId || toUserIds[0] || "";
  const readBy = Array.isArray(raw.readBy) ? [...raw.readBy] : [];
  if (raw.readAt && toUserId && !readBy.includes(toUserId)) {
    readBy.push(toUserId);
  }

  return {
    ...raw,
    toUserId,
    toUserIds,
    threadId: raw.threadId || raw.id,
    parentMessageId: raw.parentMessageId ?? null,
    readBy,
    starredBy: Array.isArray(raw.starredBy) ? raw.starredBy : [],
    archivedBy: Array.isArray(raw.archivedBy) ? raw.archivedBy : [],
    deletedBy: Array.isArray(raw.deletedBy) ? raw.deletedBy : [],
  };
}

export function isParticipant(message: TeamMessage, userId: string) {
  const m = normalizeMessage(message);
  return m.fromUserId === userId || m.toUserIds.includes(userId);
}

export function isRecipient(message: TeamMessage, userId: string) {
  return normalizeMessage(message).toUserIds.includes(userId);
}

export function isUnreadFor(message: TeamMessage, userId: string) {
  const m = normalizeMessage(message);
  return m.toUserIds.includes(userId) && !m.readBy.includes(userId);
}

export function isStarredFor(message: TeamMessage, userId: string) {
  return normalizeMessage(message).starredBy.includes(userId);
}

export function isArchivedFor(message: TeamMessage, userId: string) {
  return normalizeMessage(message).archivedBy.includes(userId);
}

export function isDeletedFor(message: TeamMessage, userId: string) {
  return normalizeMessage(message).deletedBy.includes(userId);
}

export function previewBody(body: string, max = 90) {
  const text = body.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export function replySubject(subject: string) {
  const trimmed = subject.trim();
  if (/^re:/i.test(trimmed)) return trimmed;
  return `Re: ${trimmed}`;
}

export function filterMailbox(
  messages: TeamMessage[],
  userId: string,
  folder: InboxFolder,
  opts?: { isAdmin?: boolean }
) {
  const rows = messages.map(normalizeMessage);

  if (folder === "all") {
    if (!opts?.isAdmin) return [];
    return rows;
  }

  return rows.filter((m) => {
    const participant = isParticipant(m, userId);
    if (!participant) return false;

    const deleted = isDeletedFor(m, userId);
    const archived = isArchivedFor(m, userId);

    if (folder === "trash") return deleted;

    if (deleted) return false;

    if (folder === "archive") return archived;
    if (archived) return false;

    if (folder === "sent") return m.fromUserId === userId;
    if (folder === "starred") return isStarredFor(m, userId);
    if (folder === "unread") return isUnreadFor(m, userId);
    // inbox: received and not archived/deleted
    return m.toUserIds.includes(userId);
  });
}

export function countUnread(messages: TeamMessage[], userId: string) {
  return filterMailbox(messages, userId, "unread").length;
}

export function searchMessages(
  messages: TeamMessage[],
  query: string,
  userMap: Map<string, { name?: string | null; email?: string | null }>
) {
  const q = query.trim().toLowerCase();
  if (!q) return messages;
  return messages.filter((m) => {
    const from = userMap.get(m.fromUserId);
    const toNames = m.toUserIds
      .map((id) => userMap.get(id)?.name || userMap.get(id)?.email || "")
      .join(" ");
    const hay = [
      m.subject,
      m.body,
      from?.name,
      from?.email,
      toNames,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}
