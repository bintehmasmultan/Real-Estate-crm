"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toJsonArray } from "@/lib/utils";

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
  photos: z.string().optional(),
  documents: z.string().optional(),
  listingAgentId: z.string().optional().nullable(),
  ownerContactId: z.string().optional().nullable(),
});

function formToProperty(formData: FormData) {
  const photos = toJsonArray(
    String(formData.get("photos") || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  const documents = toJsonArray(
    String(formData.get("documents") || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
  );

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
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const data = formToProperty(formData);
  await prisma.property.create({
    data: {
      ...data,
      photos: data.photos || "[]",
      documents: data.documents || "[]",
      listingAgentId: data.listingAgentId || session.user.id,
      ownerContactId: data.ownerContactId || null,
    },
  });
  revalidatePath("/properties");
  revalidatePath("/dashboard");
}

export async function updateProperty(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const data = formToProperty(formData);
  await prisma.property.update({
    where: { id },
    data: {
      ...data,
      photos: data.photos || "[]",
      documents: data.documents || "[]",
      listingAgentId: data.listingAgentId || null,
      ownerContactId: data.ownerContactId || null,
    },
  });
  revalidatePath("/properties");
  revalidatePath(`/properties/${id}`);
}

export async function deleteProperty(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  await prisma.property.delete({ where: { id } });
  revalidatePath("/properties");
}
