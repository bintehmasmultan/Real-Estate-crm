"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createContact as createContactDoc,
  removeContact,
  updateContact as updateContactDoc,
} from "@/lib/db/crm";
import { requireSessionUser } from "@/lib/firebase/session";

const contactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  type: z.string(),
  status: z.string(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  budgetMin: z.coerce.number().optional().nullable(),
  budgetMax: z.coerce.number().optional().nullable(),
  preferredLocation: z.string().optional(),
  preferredType: z.string().optional(),
  beds: z.coerce.number().optional().nullable(),
  baths: z.coerce.number().optional().nullable(),
  preferenceNotes: z.string().optional(),
  assignedAgentId: z.string().optional().nullable(),
});

function formToContact(formData: FormData) {
  const tagsRaw = String(formData.get("tags") || "");
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return contactSchema.parse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email") || "",
    phone: formData.get("phone") || undefined,
    whatsapp: formData.get("whatsapp") || undefined,
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    type: formData.get("type"),
    status: formData.get("status"),
    source: formData.get("source") || undefined,
    notes: formData.get("notes") || undefined,
    budgetMin: formData.get("budgetMin") || null,
    budgetMax: formData.get("budgetMax") || null,
    preferredLocation: formData.get("preferredLocation") || undefined,
    preferredType: formData.get("preferredType") || undefined,
    beds: formData.get("beds") || null,
    baths: formData.get("baths") || null,
    preferenceNotes: formData.get("preferenceNotes") || undefined,
    assignedAgentId: formData.get("assignedAgentId") || null,
    tags,
  });
}

export async function createContact(formData: FormData) {
  const session = await requireSessionUser();
  const data = formToContact(formData);

  await createContactDoc({
    ...data,
    email: data.email || null,
    tags: data.tags ?? [],
    assignedAgentId: data.assignedAgentId || session.id,
  });

  revalidatePath("/contacts");
  revalidatePath("/dashboard");
}

export async function updateContact(id: string, formData: FormData) {
  await requireSessionUser();
  const data = formToContact(formData);

  await updateContactDoc(id, {
    ...data,
    email: data.email || null,
    tags: data.tags ?? [],
    assignedAgentId: data.assignedAgentId || null,
  });

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
}

export async function deleteContact(id: string) {
  await requireSessionUser();
  await removeContact(id);
  revalidatePath("/contacts");
}
