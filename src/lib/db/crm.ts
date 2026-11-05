import {
  createDoc,
  deleteDoc,
  getDoc,
  listDocs,
  newId,
  nowIso,
  updateDoc,
} from "@/lib/db/firestore";
import type {
  Activity,
  AppUser,
  Contact,
  ContactProperty,
  Deal,
  InboxFolder,
  Lead,
  Note,
  PipelineStage,
  Property,
  Task,
  Team,
  TeamInvite,
  TeamMessage,
} from "@/lib/types";
import type { Role } from "@/lib/constants";
import {
  countUnread,
  filterMailbox,
  normalizeMessage,
} from "@/lib/inbox";

function scopeBy(
  agentIds: string[] | null,
  value?: string | null
) {
  if (!agentIds) return true;
  if (!value) return false;
  return agentIds.includes(value);
}

export async function getUsers(): Promise<AppUser[]> {
  const users = await listDocs<AppUser>("users");
  return users.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getUser(id: string) {
  return getDoc<AppUser>("users", id);
}

export async function updateUser(id: string, data: Partial<AppUser>) {
  return updateDoc("users", id, data);
}

export async function removeUser(id: string) {
  return deleteDoc("users", id);
}

export async function listTeams(): Promise<Team[]> {
  const rows = await listDocs<Team>("teams");
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getTeam(id: string) {
  return getDoc<Team>("teams", id);
}

export async function createTeam(
  data: Omit<Team, "id" | "createdAt" | "updatedAt">
) {
  return createDoc("teams", data);
}

export async function updateTeam(id: string, data: Partial<Team>) {
  return updateDoc("teams", id, data);
}

export async function removeTeam(id: string) {
  return deleteDoc("teams", id);
}

export async function listInvites(): Promise<TeamInvite[]> {
  const rows = await listDocs<TeamInvite>("invites");
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getInviteByToken(token: string) {
  const rows = await listDocs<TeamInvite>("invites");
  return rows.find((i) => i.token === token) || null;
}

export async function getPendingInviteByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const rows = await listDocs<TeamInvite>("invites");
  return (
    rows.find(
      (i) => i.email === normalized && i.status === "PENDING"
    ) || null
  );
}

export async function createInvite(data: {
  email: string;
  teamId: string;
  role: Role;
  token: string;
  invitedById: string;
}) {
  return createDoc("invites", {
    ...data,
    email: data.email.trim().toLowerCase(),
    status: "PENDING" as const,
    acceptedAt: null,
  });
}

export async function updateInvite(
  id: string,
  data: Partial<TeamInvite>
) {
  return updateDoc("invites", id, data);
}

export async function removeInvite(id: string) {
  return deleteDoc("invites", id);
}

export async function listMessages(): Promise<TeamMessage[]> {
  const rows = await listDocs<TeamMessage>("messages");
  return rows
    .map(normalizeMessage)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listMessagesForUser(
  userId: string,
  opts?: { folder?: InboxFolder; isAdmin?: boolean }
): Promise<TeamMessage[]> {
  const rows = await listMessages();
  return filterMailbox(rows, userId, opts?.folder || "inbox", {
    isAdmin: opts?.isAdmin,
  });
}

export async function countUnreadMessages(userId: string) {
  const rows = await listMessages();
  return countUnread(rows, userId);
}

export async function getMessage(id: string) {
  const row = await getDoc<TeamMessage>("messages", id);
  return row ? normalizeMessage(row) : null;
}

export async function listThreadMessages(threadId: string) {
  const rows = await listMessages();
  return rows
    .filter((m) => m.threadId === threadId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function createMessage(
  data: Omit<TeamMessage, "id" | "createdAt" | "updatedAt" | "threadId"> & {
    threadId?: string;
    id?: string;
  }
) {
  const id = data.id || newId();
  const toUserIds = Array.from(
    new Set((data.toUserIds?.length ? data.toUserIds : [data.toUserId]).filter(Boolean))
  );
  const payload: Omit<TeamMessage, "id" | "createdAt" | "updatedAt"> = {
    fromUserId: data.fromUserId,
    toUserId: data.toUserId || toUserIds[0] || "",
    toUserIds,
    subject: data.subject,
    body: data.body,
    threadId: data.threadId || id,
    parentMessageId: data.parentMessageId ?? null,
    readBy: data.readBy ?? [],
    starredBy: data.starredBy ?? [],
    archivedBy: data.archivedBy ?? [],
    deletedBy: data.deletedBy ?? [],
    readAt: data.readAt ?? null,
    contactId: data.contactId ?? null,
    propertyId: data.propertyId ?? null,
    dealId: data.dealId ?? null,
    leadId: data.leadId ?? null,
  };
  await createDoc("messages", payload, id);
  return id;
}

export async function markMessageRead(id: string, userId: string) {
  const message = await getMessage(id);
  if (!message) return;
  if (message.readBy.includes(userId)) return;
  await updateDoc("messages", id, {
    readBy: [...message.readBy, userId],
    readAt: nowIso(),
  });
}

export async function markMessageUnread(id: string, userId: string) {
  const message = await getMessage(id);
  if (!message) return;
  await updateDoc("messages", id, {
    readBy: message.readBy.filter((uid) => uid !== userId),
    readAt: null,
  });
}

export async function toggleMessageStar(id: string, userId: string) {
  const message = await getMessage(id);
  if (!message) return false;
  const starred = message.starredBy.includes(userId);
  await updateDoc("messages", id, {
    starredBy: starred
      ? message.starredBy.filter((uid) => uid !== userId)
      : [...message.starredBy, userId],
  });
  return !starred;
}

export async function setMessageArchived(
  id: string,
  userId: string,
  archived: boolean
) {
  const message = await getMessage(id);
  if (!message) return;
  const has = message.archivedBy.includes(userId);
  if (archived && !has) {
    await updateDoc("messages", id, {
      archivedBy: [...message.archivedBy, userId],
      deletedBy: message.deletedBy.filter((uid) => uid !== userId),
    });
  }
  if (!archived && has) {
    await updateDoc("messages", id, {
      archivedBy: message.archivedBy.filter((uid) => uid !== userId),
    });
  }
}

export async function setMessageDeleted(
  id: string,
  userId: string,
  deleted: boolean
) {
  const message = await getMessage(id);
  if (!message) return;
  const has = message.deletedBy.includes(userId);
  if (deleted && !has) {
    await updateDoc("messages", id, {
      deletedBy: [...message.deletedBy, userId],
      archivedBy: message.archivedBy.filter((uid) => uid !== userId),
    });
  }
  if (!deleted && has) {
    await updateDoc("messages", id, {
      deletedBy: message.deletedBy.filter((uid) => uid !== userId),
    });
  }
}

export async function removeMessage(id: string) {
  return deleteDoc("messages", id);
}

export async function listContacts(agentIds: string[] | null) {
  const rows = await listDocs<Contact>("contacts");
  return rows
    .filter((c) => scopeBy(agentIds, c.assignedAgentId))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getContact(id: string) {
  return getDoc<Contact>("contacts", id);
}

export async function createContact(
  data: Omit<Contact, "id" | "createdAt" | "updatedAt">
) {
  return createDoc("contacts", data);
}

export async function updateContact(id: string, data: Partial<Contact>) {
  return updateDoc("contacts", id, data);
}

export async function removeContact(id: string) {
  return deleteDoc("contacts", id);
}

export async function listProperties(agentIds: string[] | null) {
  const rows = await listDocs<Property>("properties");
  return rows
    .filter((p) => scopeBy(agentIds, p.listingAgentId))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getProperty(id: string) {
  return getDoc<Property>("properties", id);
}

export async function createProperty(
  data: Omit<Property, "id" | "createdAt" | "updatedAt">
) {
  return createDoc("properties", data);
}

export async function updateProperty(id: string, data: Partial<Property>) {
  return updateDoc("properties", id, data);
}

export async function removeProperty(id: string) {
  return deleteDoc("properties", id);
}

export async function listLeads(agentIds: string[] | null) {
  const rows = await listDocs<Lead>("leads");
  return rows
    .filter((l) => scopeBy(agentIds, l.assignedAgentId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getLead(id: string) {
  return getDoc<Lead>("leads", id);
}

export async function createLead(
  data: Omit<Lead, "id" | "createdAt" | "updatedAt">
) {
  return createDoc("leads", data);
}

export async function updateLead(id: string, data: Partial<Lead>) {
  return updateDoc("leads", id, data);
}

export async function removeLead(id: string) {
  return deleteDoc("leads", id);
}

export async function listStages(pipeline: string) {
  const rows = await listDocs<PipelineStage>("pipelineStages");
  return rows
    .filter((s) => s.pipeline === pipeline)
    .sort((a, b) => a.order - b.order);
}

export async function getStage(id: string) {
  return getDoc<PipelineStage>("pipelineStages", id);
}

export async function listDeals(agentIds: string[] | null, pipeline?: string) {
  let rows = await listDocs<Deal>("deals");
  rows = rows.filter((d) => scopeBy(agentIds, d.agentId));
  if (pipeline) rows = rows.filter((d) => d.pipeline === pipeline);
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getDeal(id: string) {
  return getDoc<Deal>("deals", id);
}

export async function createDeal(
  data: Omit<Deal, "id" | "createdAt" | "updatedAt">
) {
  return createDoc("deals", data);
}

export async function updateDeal(id: string, data: Partial<Deal>) {
  return updateDoc("deals", id, data);
}

export async function removeDeal(id: string) {
  return deleteDoc("deals", id);
}

export async function listTasks(agentIds: string[] | null) {
  const rows = await listDocs<Task>("tasks");
  return rows
    .filter((t) => scopeBy(agentIds, t.assigneeId))
    .sort((a, b) => (a.dueAt || "").localeCompare(b.dueAt || ""));
}

export async function createTask(
  data: Omit<Task, "id" | "createdAt" | "updatedAt">
) {
  return createDoc("tasks", data);
}

export async function updateTask(id: string, data: Partial<Task>) {
  return updateDoc("tasks", id, data);
}

export async function getTask(id: string) {
  return getDoc<Task>("tasks", id);
}

export async function removeTask(id: string) {
  return deleteDoc("tasks", id);
}

export async function listActivities(opts?: {
  createdByIds?: string[] | null;
  contactId?: string;
  limit?: number;
}) {
  let activities = await listDocs<Activity>("activities");
  activities.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (opts?.createdByIds) {
    activities = activities.filter(
      (a) => a.createdById && opts.createdByIds!.includes(a.createdById)
    );
  }
  if (opts?.contactId) {
    activities = activities.filter((a) => a.contactId === opts.contactId);
  }
  if (opts?.limit) activities = activities.slice(0, opts.limit);
  return activities;
}

export async function createActivity(data: Omit<Activity, "id" | "createdAt">) {
  return createDoc("activities", { ...data, createdAt: nowIso() });
}

export async function listNotes(
  contactId?: string,
  propertyId?: string,
  dealId?: string
) {
  let notes = await listDocs<Note>("notes");
  notes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (contactId) notes = notes.filter((n) => n.contactId === contactId);
  if (propertyId) notes = notes.filter((n) => n.propertyId === propertyId);
  if (dealId) notes = notes.filter((n) => n.dealId === dealId);
  return notes;
}

export async function listContactProperties(
  contactId?: string,
  propertyId?: string
) {
  let rows = await listDocs<ContactProperty>("contactProperties");
  if (contactId) rows = rows.filter((r) => r.contactId === contactId);
  if (propertyId) rows = rows.filter((r) => r.propertyId === propertyId);
  return rows;
}

export async function countLeads(agentIds: string[] | null) {
  const leads = await listLeads(agentIds);
  return leads.filter((l) => l.status !== "CONVERTED").length;
}

export async function countActiveDeals(agentIds: string[] | null) {
  const deals = await listDeals(agentIds);
  return deals.filter((d) => !d.closedAt).length;
}

export async function sumPipelineValue(agentIds: string[] | null) {
  const deals = await listDeals(agentIds);
  return deals
    .filter((d) => !d.closedAt)
    .reduce((s, d) => s + (d.value || 0), 0);
}

export async function countClosedThisMonth(agentIds: string[] | null) {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const deals = await listDeals(agentIds);
  return deals.filter((d) => d.closedAt && new Date(d.closedAt) >= start)
    .length;
}
