"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createActivity,
  createDeal as createDealDoc,
  getStage,
  updateDeal as updateDealDoc,
} from "@/lib/db/crm";
import { requireSessionUser } from "@/lib/firebase/session";
import { nowIso } from "@/lib/db/firestore";

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
  const session = await requireSessionUser();
  const data = parseDeal(formData);

  await createDealDoc({
    title: data.title,
    pipeline: data.pipeline,
    stageId: data.stageId,
    value: data.value,
    probability: data.probability,
    expectedCloseDate: data.expectedCloseDate || null,
    contactId: data.contactId || null,
    propertyId: data.propertyId || null,
    agentId: data.agentId || session.id,
    notes: data.notes,
  });

  revalidatePath("/deals");
  revalidatePath("/dashboard");
}

export async function updateDealStage(dealId: string, stageId: string) {
  const session = await requireSessionUser();

  const stage = await getStage(stageId);
  if (!stage) throw new Error("Stage not found");

  const isClosed =
    stage.name.toLowerCase().includes("closed") ||
    stage.name.toLowerCase().includes("moved in");

  await updateDealDoc(dealId, {
    stageId,
    closedAt: isClosed ? nowIso() : null,
    ...(isClosed ? { probability: 100 } : {}),
  });

  await createActivity({
    type: "STATUS_CHANGE",
    subject: `Moved to ${stage.name}`,
    body: `Deal stage updated to ${stage.name}`,
    createdById: session.id,
    dealId,
  });

  revalidatePath("/deals");
  revalidatePath("/dashboard");
}

export async function updateDeal(id: string, formData: FormData) {
  await requireSessionUser();
  const data = parseDeal(formData);

  await updateDealDoc(id, {
    title: data.title,
    pipeline: data.pipeline,
    stageId: data.stageId,
    value: data.value,
    probability: data.probability,
    expectedCloseDate: data.expectedCloseDate || null,
    contactId: data.contactId || null,
    propertyId: data.propertyId || null,
    agentId: data.agentId || null,
    notes: data.notes,
  });

  revalidatePath("/deals");
}
