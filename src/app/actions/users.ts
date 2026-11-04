"use server";

import { revalidatePath } from "next/cache";
import { getUser, getUsers, updateUser } from "@/lib/db/crm";
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
  revalidatePath("/admin/users");
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
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim() || null;
  if (!name) throw new Error("Name is required");

  const current = await getUser(session.id);
  if (!current) throw new Error("User not found");

  await updateUser(session.id, { name, phone });
  revalidatePath("/settings/profile");
  revalidatePath("/dashboard");
}
