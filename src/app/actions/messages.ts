"use server";

import { revalidatePath } from "next/cache";
import {
  createMessage,
  getMessage,
  getUser,
  markMessageRead,
  removeMessage,
} from "@/lib/db/crm";
import { requireSessionUser } from "@/lib/firebase/session";
import { canDeleteRecords } from "@/lib/rbac";

export async function sendMessage(formData: FormData) {
  const session = await requireSessionUser();
  const toUserId = String(formData.get("toUserId") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const contactId = String(formData.get("contactId") || "") || null;
  const propertyId = String(formData.get("propertyId") || "") || null;
  const dealId = String(formData.get("dealId") || "") || null;
  const leadId = String(formData.get("leadId") || "") || null;

  if (!toUserId) throw new Error("Select a recipient");
  if (!subject) throw new Error("Subject is required");
  if (!body) throw new Error("Message body is required");
  if (toUserId === session.id) throw new Error("Cannot message yourself");

  const recipient = await getUser(toUserId);
  if (!recipient) throw new Error("Recipient not found");

  await createMessage({
    fromUserId: session.id,
    toUserId,
    subject,
    body,
    readAt: null,
    contactId,
    propertyId,
    dealId,
    leadId,
  });

  revalidatePath("/inbox");
}

export async function markInboxMessageRead(id: string) {
  const session = await requireSessionUser();
  const message = await getMessage(id);
  if (!message) throw new Error("Message not found");

  const isRecipient = message.toUserId === session.id;
  const isAdmin = session.role === "ADMIN";
  if (!isRecipient && !isAdmin) throw new Error("Unauthorized");

  if (!message.readAt && isRecipient) {
    await markMessageRead(id);
  }

  revalidatePath("/inbox");
}

export async function deleteMessage(id: string) {
  const session = await requireSessionUser();
  if (!canDeleteRecords(session)) throw new Error("Unauthorized");

  const message = await getMessage(id);
  if (!message) throw new Error("Message not found");

  await removeMessage(id);
  revalidatePath("/inbox");
}
