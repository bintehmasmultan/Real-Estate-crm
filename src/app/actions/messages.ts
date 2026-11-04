"use server";

import { revalidatePath } from "next/cache";
import {
  createMessage,
  getMessage,
  getUser,
  getUsers,
  listMessagesForUser,
  listThreadMessages,
  markMessageRead,
  markMessageUnread,
  removeMessage,
  setMessageArchived,
  setMessageDeleted,
  toggleMessageStar,
} from "@/lib/db/crm";
import { requireSessionUser } from "@/lib/firebase/session";
import { canDeleteRecords } from "@/lib/rbac";
import { isParticipant, isRecipient, replySubject } from "@/lib/inbox";

function revalidateInbox() {
  revalidatePath("/inbox");
  revalidatePath("/dashboard");
}

function parseRecipientIds(formData: FormData) {
  const multi = formData
    .getAll("toUserIds")
    .map((v) => String(v).trim())
    .filter(Boolean);
  const single = String(formData.get("toUserId") || "").trim();
  const ids = Array.from(new Set(multi.length ? multi : single ? [single] : []));
  return ids;
}

async function assertValidRecipients(fromUserId: string, toUserIds: string[]) {
  if (toUserIds.length === 0) throw new Error("Select at least one recipient");
  if (toUserIds.includes(fromUserId)) {
    throw new Error("Cannot include yourself as a recipient");
  }
  const users = await getUsers();
  const allowed = new Set(
    users.filter((u) => u.role !== "PENDING").map((u) => u.id)
  );
  for (const id of toUserIds) {
    if (!allowed.has(id)) throw new Error("Invalid recipient");
    const user = await getUser(id);
    if (!user) throw new Error("Recipient not found");
  }
}

export async function sendMessage(formData: FormData) {
  const session = await requireSessionUser();
  const toUserIds = parseRecipientIds(formData);
  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const contactId = String(formData.get("contactId") || "") || null;
  const propertyId = String(formData.get("propertyId") || "") || null;
  const dealId = String(formData.get("dealId") || "") || null;
  const leadId = String(formData.get("leadId") || "") || null;
  const parentMessageId = String(formData.get("parentMessageId") || "") || null;

  if (!subject) throw new Error("Subject is required");
  if (!body) throw new Error("Message body is required");
  await assertValidRecipients(session.id, toUserIds);

  let threadId: string | undefined;
  let resolvedParent: string | null = parentMessageId;
  let resolvedSubject = subject;
  let resolvedContactId = contactId;
  let resolvedPropertyId = propertyId;
  let resolvedDealId = dealId;
  let resolvedLeadId = leadId;

  if (parentMessageId) {
    const parent = await getMessage(parentMessageId);
    if (!parent || !isParticipant(parent, session.id)) {
      throw new Error("Cannot reply to this message");
    }
    threadId = parent.threadId;
    resolvedParent = parent.id;
    if (!subject || subject === parent.subject) {
      resolvedSubject = replySubject(parent.subject);
    }
    resolvedContactId = contactId || parent.contactId || null;
    resolvedPropertyId = propertyId || parent.propertyId || null;
    resolvedDealId = dealId || parent.dealId || null;
    resolvedLeadId = leadId || parent.leadId || null;
  }

  const id = await createMessage({
    fromUserId: session.id,
    toUserId: toUserIds[0],
    toUserIds,
    subject: resolvedSubject,
    body,
    threadId,
    parentMessageId: resolvedParent,
    readBy: [session.id],
    starredBy: [],
    archivedBy: [],
    deletedBy: [],
    contactId: resolvedContactId,
    propertyId: resolvedPropertyId,
    dealId: resolvedDealId,
    leadId: resolvedLeadId,
  });

  revalidateInbox();
  return id;
}

export async function replyToMessage(formData: FormData) {
  const parentMessageId = String(formData.get("parentMessageId") || "").trim();
  if (!parentMessageId) throw new Error("Missing parent message");
  return sendMessage(formData);
}

export async function markInboxMessageRead(id: string) {
  const session = await requireSessionUser();
  const message = await getMessage(id);
  if (!message) throw new Error("Message not found");
  if (!isRecipient(message, session.id) && session.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  if (isRecipient(message, session.id)) {
    await markMessageRead(id, session.id);
  }
  revalidateInbox();
}

export async function markInboxMessageUnread(id: string) {
  const session = await requireSessionUser();
  const message = await getMessage(id);
  if (!message) throw new Error("Message not found");
  if (!isRecipient(message, session.id)) throw new Error("Unauthorized");
  await markMessageUnread(id, session.id);
  revalidateInbox();
}

export async function toggleInboxStar(id: string) {
  const session = await requireSessionUser();
  const message = await getMessage(id);
  if (!message) throw new Error("Message not found");
  if (!isParticipant(message, session.id)) throw new Error("Unauthorized");
  const starred = await toggleMessageStar(id, session.id);
  revalidateInbox();
  return starred;
}

export async function archiveInboxMessage(id: string) {
  const session = await requireSessionUser();
  const message = await getMessage(id);
  if (!message) throw new Error("Message not found");
  if (!isParticipant(message, session.id)) throw new Error("Unauthorized");
  await setMessageArchived(id, session.id, true);
  revalidateInbox();
}

export async function unarchiveInboxMessage(id: string) {
  const session = await requireSessionUser();
  const message = await getMessage(id);
  if (!message) throw new Error("Message not found");
  if (!isParticipant(message, session.id)) throw new Error("Unauthorized");
  await setMessageArchived(id, session.id, false);
  revalidateInbox();
}

export async function trashInboxMessage(id: string) {
  const session = await requireSessionUser();
  const message = await getMessage(id);
  if (!message) throw new Error("Message not found");
  if (!isParticipant(message, session.id)) throw new Error("Unauthorized");
  await setMessageDeleted(id, session.id, true);
  revalidateInbox();
}

export async function restoreInboxMessage(id: string) {
  const session = await requireSessionUser();
  const message = await getMessage(id);
  if (!message) throw new Error("Message not found");
  if (!isParticipant(message, session.id)) throw new Error("Unauthorized");
  await setMessageDeleted(id, session.id, false);
  revalidateInbox();
}

/** Soft-delete for participants; hard-delete when permanent=true. */
export async function deleteMessage(id: string, opts?: { permanent?: boolean }) {
  const session = await requireSessionUser();
  const message = await getMessage(id);
  if (!message) throw new Error("Message not found");

  if (opts?.permanent) {
    if (canDeleteRecords(session)) {
      await removeMessage(id);
    } else if (isParticipant(message, session.id)) {
      if (!message.deletedBy.includes(session.id)) {
        throw new Error("Move to trash before permanently deleting");
      }
      await removeMessage(id);
    } else {
      throw new Error("Unauthorized");
    }
  } else {
    if (!isParticipant(message, session.id)) throw new Error("Unauthorized");
    await setMessageDeleted(id, session.id, true);
  }

  revalidateInbox();
}

export async function emptyInboxTrash() {
  const session = await requireSessionUser();
  const trash = await listMessagesForUser(session.id, { folder: "trash" });
  for (const msg of trash) {
    const others = [msg.fromUserId, ...msg.toUserIds].filter(
      (uid, i, arr) => arr.indexOf(uid) === i && uid !== session.id
    );
    const allOthersDeleted = others.every((uid) => msg.deletedBy.includes(uid));
    if (allOthersDeleted || others.length === 0) {
      await removeMessage(msg.id);
    }
    // Otherwise keep soft-deleted for this user only
  }
  revalidateInbox();
}

export async function getThreadForInbox(threadId: string) {
  const session = await requireSessionUser();
  const thread = await listThreadMessages(threadId);
  return thread.filter((m) => isParticipant(m, session.id) || session.role === "ADMIN");
}
