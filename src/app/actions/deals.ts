"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const dealSchema = z.object({
  title: z.string().min(1),
  pipeline: z.string(),
  stageId: z.string().min(1),
  value: z.coerce.number().default(0),
  probability: z.coerce.number().min(0).max(100).default(50),
  expectedCloseDate: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  propertyId: z.string().optional().nullable(),
  agentId: z.string().optional().nullable(),
  notes: z.string().optional(),
});

function parseDeal(formData: FormData) {
  return dealSchema.parse({
    title: formData.get("title"),
    pipeline: formData.get("pipeline") || "SALES",
    stageId: formData.get("stageId"),
    value: formData.get("value") || 0,
    probability: formData.get("probability") || 50,
    expectedCloseDate: formData.get("expectedCloseDate") || null,
    contactId: formData.get("contactId") || null,
    propertyId: formData.get("propertyId") || null,
    agentId: formData.get("agentId") || null,
    notes: formData.get("notes") || undefined,
  });
}

export async function createDeal(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const data = parseDeal(formData);
  await prisma.deal.create({
    data: {
      title: data.title,
      pipeline: data.pipeline,
      stageId: data.stageId,
      value: data.value,
      probability: data.probability,
      expectedCloseDate: data.expectedCloseDate
        ? new Date(data.expectedCloseDate)
        : null,
      contactId: data.contactId || null,
      propertyId: data.propertyId || null,
      agentId: data.agentId || session.user.id,
      notes: data.notes,
    },
  });
  revalidatePath("/deals");
  revalidatePath("/dashboard");
}

export async function updateDealStage(dealId: string, stageId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const stage = await prisma.pipelineStage.findUnique({ where: { id: stageId } });
  if (!stage) throw new Error("Stage not found");

  const isClosed =
    stage.name.toLowerCase().includes("closed") ||
    stage.name.toLowerCase().includes("moved in");

  await prisma.deal.update({
    where: { id: dealId },
    data: {
      stageId,
      closedAt: isClosed ? new Date() : null,
      probability: isClosed ? 100 : undefined,
    },
  });

  await prisma.activity.create({
    data: {
      type: "STATUS_CHANGE",
      subject: `Moved to ${stage.name}`,
      body: `Deal stage updated to ${stage.name}`,
      createdById: session.user.id,
      dealId,
    },
  });

  revalidatePath("/deals");
  revalidatePath("/dashboard");
}

export async function updateDeal(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const data = parseDeal(formData);
  await prisma.deal.update({
    where: { id },
    data: {
      title: data.title,
      pipeline: data.pipeline,
      stageId: data.stageId,
      value: data.value,
      probability: data.probability,
      expectedCloseDate: data.expectedCloseDate
        ? new Date(data.expectedCloseDate)
        : null,
      contactId: data.contactId || null,
      propertyId: data.propertyId || null,
      agentId: data.agentId || null,
      notes: data.notes,
    },
  });
  revalidatePath("/deals");
}
