"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueAt: z.string().optional().nullable(),
  priority: z.string().default("MEDIUM"),
  status: z.string().default("TODO"),
  assigneeId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  propertyId: z.string().optional().nullable(),
  dealId: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
});

function parseTask(formData: FormData) {
  return taskSchema.parse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    dueAt: formData.get("dueAt") || null,
    priority: formData.get("priority") || "MEDIUM",
    status: formData.get("status") || "TODO",
    assigneeId: formData.get("assigneeId") || null,
    contactId: formData.get("contactId") || null,
    propertyId: formData.get("propertyId") || null,
    dealId: formData.get("dealId") || null,
    leadId: formData.get("leadId") || null,
  });
}

export async function createTask(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const data = parseTask(formData);
  await prisma.task.create({
    data: {
      ...data,
      dueAt: data.dueAt ? new Date(data.dueAt) : null,
      assigneeId: data.assigneeId || session.user.id,
      createdById: session.user.id,
      contactId: data.contactId || null,
      propertyId: data.propertyId || null,
      dealId: data.dealId || null,
      leadId: data.leadId || null,
    },
  });
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}

export async function updateTask(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const data = parseTask(formData);
  await prisma.task.update({
    where: { id },
    data: {
      ...data,
      dueAt: data.dueAt ? new Date(data.dueAt) : null,
      assigneeId: data.assigneeId || null,
      contactId: data.contactId || null,
      propertyId: data.propertyId || null,
      dealId: data.dealId || null,
      leadId: data.leadId || null,
    },
  });
  revalidatePath("/tasks");
  revalidatePath("/calendar");
}

export async function toggleTaskDone(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return;
  await prisma.task.update({
    where: { id },
    data: { status: task.status === "DONE" ? "TODO" : "DONE" },
  });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function createActivity(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.activity.create({
    data: {
      type: String(formData.get("type") || "NOTE"),
      subject: String(formData.get("subject") || "") || null,
      body: String(formData.get("body") || "") || null,
      createdById: session.user.id,
      contactId: (formData.get("contactId") as string) || null,
      propertyId: (formData.get("propertyId") as string) || null,
      dealId: (formData.get("dealId") as string) || null,
      leadId: (formData.get("leadId") as string) || null,
      scheduledAt: formData.get("scheduledAt")
        ? new Date(String(formData.get("scheduledAt")))
        : null,
    },
  });

  const contactId = formData.get("contactId");
  if (contactId) revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
}
