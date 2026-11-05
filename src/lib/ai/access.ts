import { NextResponse } from "next/server";
import { requireSessionUser, type SessionUser } from "@/lib/firebase/session";
import {
  getContact,
  getDeal,
  getLead,
  listActivities,
  listProperties,
} from "@/lib/db/crm";
import { getTeamAgentIds, inAgentScope } from "@/lib/rbac";
import type { Activity, Contact, Deal, Lead, Property } from "@/lib/types";

export async function requireAiSession() {
  try {
    return await requireSessionUser();
  } catch {
    return null;
  }
}

export function unauthorizedJson() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function badRequestJson(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function serverErrorJson(message = "AI request failed") {
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function loadScopedContact(
  session: SessionUser,
  contactId: string
): Promise<{ contact: Contact; agentIds: string[] | null } | null> {
  const contact = await getContact(contactId);
  if (!contact) return null;
  const agentIds = await getTeamAgentIds(session);
  if (!inAgentScope(agentIds, contact.assignedAgentId)) return null;
  return { contact, agentIds };
}

export async function loadScopedDeal(
  session: SessionUser,
  dealId: string
): Promise<{ deal: Deal; contact: Contact | null; agentIds: string[] | null } | null> {
  const deal = await getDeal(dealId);
  if (!deal) return null;
  const agentIds = await getTeamAgentIds(session);
  if (!inAgentScope(agentIds, deal.agentId)) return null;
  const contact = deal.contactId ? await getContact(deal.contactId) : null;
  return { deal, contact, agentIds };
}

export async function loadScopedLead(
  session: SessionUser,
  leadId: string
): Promise<{ lead: Lead; agentIds: string[] | null } | null> {
  const lead = await getLead(leadId);
  if (!lead) return null;
  const agentIds = await getTeamAgentIds(session);
  if (!inAgentScope(agentIds, lead.assignedAgentId)) return null;
  return { lead, agentIds };
}

export async function contactContextBundle(contactId: string, agentIds: string[] | null) {
  const [activities, properties] = await Promise.all([
    listActivities({ contactId, limit: 12 }),
    listProperties(agentIds),
  ]);
  return { activities, properties };
}

export function formatContactBlock(contact: Contact) {
  return {
    id: contact.id,
    name: `${contact.firstName} ${contact.lastName}`.trim(),
    type: contact.type,
    status: contact.status,
    city: contact.city,
    email: contact.email,
    phone: contact.phone,
    whatsapp: contact.whatsapp,
    budgetMin: contact.budgetMin,
    budgetMax: contact.budgetMax,
    preferredLocation: contact.preferredLocation,
    preferredType: contact.preferredType,
    beds: contact.beds,
    baths: contact.baths,
    preferenceNotes: contact.preferenceNotes,
    notes: contact.notes,
    tags: contact.tags,
  };
}

export function formatActivitiesBlock(activities: Activity[]) {
  return activities.map((a) => ({
    type: a.type,
    subject: a.subject,
    body: a.body,
    createdAt: a.createdAt,
  }));
}

export function formatPropertiesBlock(properties: Property[], limit = 20) {
  return properties.slice(0, limit).map((p) => ({
    id: p.id,
    title: p.title,
    city: p.city,
    type: p.type,
    status: p.status,
    price: p.price,
    beds: p.beds,
    baths: p.baths,
    area: p.area,
    areaUnit: p.areaUnit,
    address: p.address,
  }));
}

export function formatDealBlock(deal: Deal) {
  return {
    id: deal.id,
    title: deal.title,
    value: deal.value,
    probability: deal.probability,
    pipeline: deal.pipeline,
    notes: deal.notes,
    expectedCloseDate: deal.expectedCloseDate,
  };
}

export function formatLeadBlock(lead: Lead) {
  return {
    id: lead.id,
    name: `${lead.firstName} ${lead.lastName}`.trim(),
    status: lead.status,
    source: lead.source,
    score: lead.score,
    budget: lead.budget,
    preferredLocation: lead.preferredLocation,
    preferredType: lead.preferredType,
    message: lead.message,
    email: lead.email,
    phone: lead.phone,
  };
}
