"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createProperty as createPropertyDoc,
  getProperty,
  removeProperty,
  updateProperty as updatePropertyDoc,
} from "@/lib/db/crm";
import { requireSessionUser } from "@/lib/firebase/session";
import {
  canCreateProperty,
  canManageProperty,
  getTeamAgentIds,
} from "@/lib/rbac";

const propertySchema = z.object({
  title: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  type: z.string(),
  status: z.string(),
  price: z.coerce.number(),
  area: z.coerce.number().optional().nullable(),
  areaUnit: z.string().default("sqft"),
  beds: z.coerce.number().optional().nullable(),
  baths: z.coerce.number().optional().nullable(),
  description: z.string().optional(),
  photos: z.array(z.string()).optional(),
  documents: z.array(z.string()).optional(),
  listingAgentId: z.string().optional().nullable(),
  ownerContactId: z.string().optional().nullable(),
});

function formToProperty(formData: FormData) {
  const photos = String(formData.get("photos") || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const documents = String(formData.get("documents") || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  return propertySchema.parse({
    title: formData.get("title"),
    address: formData.get("address"),
    city: formData.get("city"),
    type: formData.get("type"),
    status: formData.get("status"),
    price: formData.get("price"),
    area: formData.get("area") || null,
    areaUnit: formData.get("areaUnit") || "sqft",
    beds: formData.get("beds") || null,
    baths: formData.get("baths") || null,
    description: formData.get("description") || undefined,
    listingAgentId: formData.get("listingAgentId") || null,
    ownerContactId: formData.get("ownerContactId") || null,
    photos,
    documents,
  });
}

export async function createProperty(formData: FormData) {
  const session = await requireSessionUser();
  if (!canCreateProperty(session)) throw new Error("Unauthorized");

  const data = formToProperty(formData);
  const agentIds = await getTeamAgentIds(session);

  let listingAgentId = data.listingAgentId || session.id;
  if (session.role !== "ADMIN") {
    // Non-admins can only assign within their team scope (usually themselves).
    if (!inScopeOrSelf(agentIds, listingAgentId, session.id)) {
      listingAgentId = session.id;
    }
  }

  await createPropertyDoc({
    ...data,
    photos: data.photos ?? [],
    documents: data.documents ?? [],
    listingAgentId,
    ownerContactId: data.ownerContactId || null,
  });

  revalidatePath("/properties");
  revalidatePath("/dashboard");
}

export async function updateProperty(id: string, formData: FormData) {
  const session = await requireSessionUser();
  const existing = await getProperty(id);
  if (!existing) throw new Error("Property not found");

  const agentIds = await getTeamAgentIds(session);
  if (!canManageProperty(session, existing.listingAgentId, agentIds)) {
    throw new Error("Unauthorized");
  }

  const data = formToProperty(formData);
  let listingAgentId = data.listingAgentId || existing.listingAgentId || session.id;
  if (session.role !== "ADMIN") {
    if (!inScopeOrSelf(agentIds, listingAgentId, session.id)) {
      listingAgentId = existing.listingAgentId || session.id;
    }
  }

  await updatePropertyDoc(id, {
    ...data,
    photos: data.photos ?? [],
    documents: data.documents ?? [],
    listingAgentId,
    ownerContactId: data.ownerContactId || null,
  });

  revalidatePath("/properties");
  revalidatePath(`/properties/${id}`);
}

export async function deleteProperty(id: string) {
  const session = await requireSessionUser();
  const existing = await getProperty(id);
  if (!existing) throw new Error("Property not found");

  const agentIds = await getTeamAgentIds(session);
  if (!canManageProperty(session, existing.listingAgentId, agentIds)) {
    throw new Error("Unauthorized");
  }

  await removeProperty(id);
  revalidatePath("/properties");
  revalidatePath("/dashboard");
}

function inScopeOrSelf(
  agentIds: string[] | null,
  listingAgentId: string,
  selfId: string
) {
  if (listingAgentId === selfId) return true;
  if (agentIds === null) return true;
  return agentIds.includes(listingAgentId);
}
