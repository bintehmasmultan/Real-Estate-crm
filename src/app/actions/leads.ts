"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  const agent = await prisma.user.findFirst({
    where: { role: "AGENT" },
    orderBy: { createdAt: "asc" },
  });
  return agent?.id ?? null;
}

export async function createPublicLead(formData: FormData) {
  const data = parseLead(formData);
  const assignedAgentId = await pickAgentId(data.assignedAgentId);
  await prisma.lead.create({
    data: {
      ...data,
      email: data.email || null,
      status: "NEW",
      assignedAgentId,
    },
  });
  return { success: true };
}

export async function createLead(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const data = parseLead(formData);
  await prisma.lead.create({
    data: {
      ...data,
      email: data.email || null,
      assignedAgentId: data.assignedAgentId || session.user.id,
    },
  });
  revalidatePath("/leads");
  revalidatePath("/dashboard");
}

export async function updateLead(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const data = parseLead(formData);
  await prisma.lead.update({
    where: { id },
    data: {
      ...data,
      email: data.email || null,
      assignedAgentId: data.assignedAgentId || null,
    },
  });
  revalidatePath("/leads");
}

export async function convertLead(leadId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead not found");
  if (lead.status === "CONVERTED") throw new Error("Already converted");

  const stage = await prisma.pipelineStage.findFirst({
    where: { pipeline: "SALES", order: 0 },
  });
  if (!stage) throw new Error("Pipeline stages missing");

  const contact = await prisma.contact.create({
    data: {
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      type: "BUYER",
      status: "LEAD",
      source: lead.source,
      budgetMax: lead.budget,
      preferredType: lead.preferredType,
      preferredLocation: lead.preferredLocation,
      assignedAgentId: lead.assignedAgentId || session.user.id,
      notes: lead.message,
    },
  });

  const deal = await prisma.deal.create({
    data: {
      title: `${lead.firstName} ${lead.lastName} — New Deal`,
      pipeline: "SALES",
      stageId: stage.id,
      value: lead.budget || 0,
      probability: Math.min(lead.score, 90),
      contactId: contact.id,
      agentId: lead.assignedAgentId || session.user.id,
    },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: "CONVERTED",
      contactId: contact.id,
      convertedDealId: deal.id,
    },
  });

  await prisma.activity.create({
    data: {
      type: "STATUS_CHANGE",
      subject: "Lead converted",
      body: `Converted to contact and deal`,
      createdById: session.user.id,
      contactId: contact.id,
      dealId: deal.id,
      leadId,
    },
  });

  revalidatePath("/leads");
  revalidatePath("/contacts");
  revalidatePath("/deals");
  revalidatePath("/dashboard");
  return { contactId: contact.id, dealId: deal.id };
}
