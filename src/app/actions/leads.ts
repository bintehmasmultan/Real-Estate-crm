"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createActivity,
  createContact,
  createDeal,
  createLead as createLeadDoc,
  getLead,
  getUsers,
  listStages,
  removeLead,
  updateLead as updateLeadDoc,
} from "@/lib/db/crm";
import { requireSessionUser } from "@/lib/firebase/session";
import { canManageAssigned, getTeamAgentIds } from "@/lib/rbac";

const leadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  source: z.string().default("WEBSITE"),
  status: z.string().default("NEW"),
  score: z.coerce.number().min(0).max(100).default(50),
  message: z.string().optional(),
  budget: z.coerce.number().optional().nullable(),
  preferredType: z.string().optional(),
  preferredLocation: z.string().optional(),
  assignedAgentId: z.string().optional().nullable(),
});

function parseLead(formData: FormData) {
  return leadSchema.parse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email") || "",
    phone: formData.get("phone") || undefined,
    source: formData.get("source") || "WEBSITE",
    status: formData.get("status") || "NEW",
    score: formData.get("score") || 50,
    message: formData.get("message") || undefined,
    budget: formData.get("budget") || null,
    preferredType: formData.get("preferredType") || undefined,
    preferredLocation: formData.get("preferredLocation") || undefined,
    assignedAgentId: formData.get("assignedAgentId") || null,
  });
}

async function pickAgentId(preferred?: string | null) {
  if (preferred) return preferred;
  const users = await getUsers();
  const agent = users.find((u) => u.role === "AGENT");
  return agent?.id ?? null;
}

export async function createPublicLead(formData: FormData) {
  const data = parseLead(formData);
  const assignedAgentId = await pickAgentId(data.assignedAgentId);

  await createLeadDoc({
    ...data,
    email: data.email || null,
    status: "NEW",
    assignedAgentId,
  });

  return { success: true };
}

export async function createLead(formData: FormData) {
  const session = await requireSessionUser();
  const data = parseLead(formData);

  await createLeadDoc({
    ...data,
    email: data.email || null,
    assignedAgentId: data.assignedAgentId || session.id,
  });

  revalidatePath("/leads");
  revalidatePath("/dashboard");
}

export async function updateLead(id: string, formData: FormData) {
  const session = await requireSessionUser();
  const existing = await getLead(id);
  if (!existing) throw new Error("Lead not found");
  const agentIds = await getTeamAgentIds(session);
  if (!canManageAssigned(session, existing.assignedAgentId, agentIds)) {
    throw new Error("Unauthorized");
  }

  const data = parseLead(formData);

  await updateLeadDoc(id, {
    ...data,
    email: data.email || null,
    assignedAgentId: data.assignedAgentId || null,
  });

  revalidatePath("/leads");
}

export async function deleteLead(id: string) {
  const session = await requireSessionUser();
  if (session.role !== "ADMIN") throw new Error("Unauthorized");
  const existing = await getLead(id);
  if (!existing) throw new Error("Lead not found");

  await removeLead(id);
  revalidatePath("/leads");
  revalidatePath("/dashboard");
}

export async function convertLead(leadId: string) {
  const session = await requireSessionUser();

  const lead = await getLead(leadId);
  if (!lead) throw new Error("Lead not found");
  if (lead.status === "CONVERTED") throw new Error("Already converted");

  const stages = await listStages("SALES");
  const stage = stages.find((s) => s.order === 0);
  if (!stage) throw new Error("Pipeline stages missing");

  const contactId = await createContact({
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: lead.phone,
    type: "BUYER",
    status: "LEAD",
    source: lead.source,
    tags: [],
    budgetMax: lead.budget,
    preferredType: lead.preferredType,
    preferredLocation: lead.preferredLocation,
    assignedAgentId: lead.assignedAgentId || session.id,
    notes: lead.message,
  });

  const dealId = await createDeal({
    title: `${lead.firstName} ${lead.lastName} — New Deal`,
    pipeline: "SALES",
    stageId: stage.id,
    value: lead.budget || 0,
    probability: Math.min(lead.score, 90),
    contactId,
    agentId: lead.assignedAgentId || session.id,
  });

  await updateLeadDoc(leadId, {
    status: "CONVERTED",
    contactId,
    convertedDealId: dealId,
  });

  await createActivity({
    type: "STATUS_CHANGE",
    subject: "Lead converted",
    body: "Converted to contact and deal",
    createdById: session.id,
    contactId,
    dealId,
    leadId,
  });

  revalidatePath("/leads");
  revalidatePath("/contacts");
  revalidatePath("/deals");
  revalidatePath("/dashboard");
  return { contactId, dealId };
}
