"use server";

import { revalidatePath } from "next/cache";
import {
  createTeam,
  getUsers,
  listTeams,
  updateTeam,
  updateUser,
} from "@/lib/db/crm";
import { requireSessionUser } from "@/lib/firebase/session";
import type { AppUser, Team } from "@/lib/types";

async function requireAdmin() {
  const session = await requireSessionUser();
  if (session.role !== "ADMIN") throw new Error("Unauthorized");
  return session;
}

function cleanName(value: FormDataEntryValue | null) {
  const name = String(value || "")
    .trim()
    .replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 80) {
    throw new Error("Team name must be 2–80 characters");
  }
  return name;
}

function assertManager(users: AppUser[], managerId: string | null) {
  if (!managerId) return;
  const manager = users.find((user) => user.id === managerId);
  if (!manager || manager.role === "PENDING") {
    throw new Error("Choose a manager with CRM access");
  }
}

function assertUniqueName(teams: Team[], name: string, exceptId?: string) {
  const taken = teams.some(
    (team) =>
      team.id !== exceptId && team.name.toLowerCase() === name.toLowerCase()
  );
  if (taken) throw new Error("A team with that name already exists");
}

export async function createTeamAction(formData: FormData) {
  await requireAdmin();
  const name = cleanName(formData.get("name"));
  const managerId = String(formData.get("managerId") || "") || null;
  const [users, teams] = await Promise.all([getUsers(), listTeams()]);
  assertManager(users, managerId);
  assertUniqueName(teams, name);

  const id = await createTeam({ name, managerId });
  if (managerId) await updateUser(managerId, { teamId: id });
  revalidatePath("/", "layout");
}

export async function updateTeamAction(formData: FormData) {
  await requireAdmin();
  const teamId = String(formData.get("teamId") || "");
  const name = cleanName(formData.get("name"));
  const managerId = String(formData.get("managerId") || "") || null;
  const [users, teams] = await Promise.all([getUsers(), listTeams()]);
  if (!teams.some((team) => team.id === teamId)) throw new Error("Team not found");
  assertManager(users, managerId);
  assertUniqueName(teams, name, teamId);

  await updateTeam(teamId, { name, managerId });
  if (managerId) await updateUser(managerId, { teamId });
  revalidatePath("/", "layout");
}

export async function assignUserTeam(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") || "");
  const teamId = String(formData.get("teamId") || "");
  if (!userId) throw new Error("Choose a person");
  const [users, teams] = await Promise.all([getUsers(), listTeams()]);
  if (!users.some((user) => user.id === userId)) throw new Error("User not found");
  if (teamId && !teams.some((team) => team.id === teamId)) {
    throw new Error("Team not found");
  }

  await updateUser(userId, { teamId: teamId || null });
  revalidatePath("/", "layout");
}
