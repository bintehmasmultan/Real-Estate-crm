"use server";

import { revalidatePath } from "next/cache";
import { getUsers, updateUser } from "@/lib/db/crm";
import { requireSessionUser } from "@/lib/firebase/session";
import { normalizeRole, type Role } from "@/lib/constants";

export async function updateUserRole(formData: FormData) {
  const session = await requireSessionUser();
  if (session.role !== "ADMIN") throw new Error("Unauthorized");

  const userId = String(formData.get("userId") || "");
  const role = normalizeRole(formData.get("role"));
  if (!userId) throw new Error("Missing user");

  if (userId === session.id && role !== "ADMIN") {
    throw new Error("You cannot remove your own admin access");
  }

  const users = await getUsers();
  const target = users.find((user) => user.id === userId);
  if (!target) throw new Error("User not found");

  if (target.role === "ADMIN" && role !== "ADMIN") {
    const admins = users.filter((user) => user.role === "ADMIN");
    if (admins.length <= 1) {
      throw new Error("At least one admin is required");
    }
  }

  await updateUser(userId, { role: role satisfies Role });
  revalidatePath("/", "layout");
}

export async function updateOwnProfile(formData: FormData) {
  const session = await requireSessionUser();
  if (session.role !== "ADMIN") throw new Error("Unauthorized");

  const name = String(formData.get("name") || "")
    .trim()
    .replace(/\s+/g, " ");
  const phone = String(formData.get("phone") || "").trim();

  if (name.length < 2 || name.length > 80) {
    throw new Error("Name must be 2–80 characters");
  }
  if (phone.length > 40) throw new Error("Phone is too long");

  await updateUser(session.id, { name, phone: phone || null });
  revalidatePath("/", "layout");
}
