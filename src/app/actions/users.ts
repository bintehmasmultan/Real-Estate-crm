"use server";

import { revalidatePath } from "next/cache";
import { getUser, getUsers, removeUser, updateUser } from "@/lib/db/crm";
import { getAdminAuth } from "@/lib/firebase/admin";
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

export async function updateUserTeam(formData: FormData) {
  const session = await requireSessionUser();
  if (session.role !== "ADMIN") throw new Error("Unauthorized");

  const userId = String(formData.get("userId") || "");
  const teamId = String(formData.get("teamId") || "") || null;
  if (!userId) throw new Error("Missing user");

  await updateUser(userId, { teamId });
  revalidatePath("/admin/users");
  revalidatePath("/admin/teams");
}

export async function updateOwnProfile(formData: FormData) {
  const session = await requireSessionUser();
  const name = String(formData.get("name") || "")
    .trim()
    .replace(/\s+/g, " ");
  const phone = String(formData.get("phone") || "").trim();

  if (name.length < 2 || name.length > 80) {
    throw new Error("Name must be 2–80 characters");
  }
  if (phone.length > 40) throw new Error("Phone is too long");

  const current = await getUser(session.id);
  if (!current) throw new Error("User not found");

  await updateUser(session.id, { name, phone: phone || null });
  revalidatePath("/", "layout");
  revalidatePath("/settings/profile");
  revalidatePath("/dashboard");
}

export async function deleteUserAccount(userId: string) {
  const session = await requireSessionUser();
  if (session.role !== "ADMIN") throw new Error("Unauthorized");
  if (!userId) throw new Error("Missing user");
  if (userId === session.id) throw new Error("You cannot delete your own account");

  const users = await getUsers();
  const target = users.find((user) => user.id === userId);
  if (!target) throw new Error("User not found");

  if (target.role === "ADMIN") {
    const admins = users.filter((user) => user.role === "ADMIN");
    if (admins.length <= 1) {
      throw new Error("At least one admin is required");
    }
  }

  await removeUser(userId);
  try {
    await getAdminAuth().deleteUser(userId);
  } catch {
    // Auth user may already be gone
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/teams");
}
