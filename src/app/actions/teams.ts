"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import {
  createInvite,
  createTeam,
  getPendingInviteByEmail,
  getTeam,
  getUsers,
  listTeams,
  removeInvite,
  removeTeam,
  updateInvite,
  updateTeam,
  updateUser,
} from "@/lib/db/crm";
import { requireSessionUser } from "@/lib/firebase/session";
import { CRM_ROLES, normalizeRole, type Role } from "@/lib/constants";
import type { AppUser, Team } from "@/lib/types";
import {
  appBaseUrl,
  gmailComposeUrl,
  isGmailConfigured,
  sendGmailInvite,
} from "@/lib/mail/gmail";

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

function revalidateTeamViews() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/teams");
  revalidatePath("/admin/users");
}

export async function createTeamAction(formData: FormData) {
  await requireAdmin();
  const name = cleanName(formData.get("name"));
  const managerId = String(formData.get("managerId") || "") || null;
  const [users, teams] = await Promise.all([getUsers(), listTeams()]);
  assertManager(users, managerId);
  assertUniqueName(teams, name);

  const id = await createTeam({ name, managerId });
  if (managerId) {
    await updateUser(managerId, { teamId: id });
  }

  revalidateTeamViews();
}

export async function updateTeamAction(formData: FormData) {
  await requireAdmin();
  const teamId = String(formData.get("teamId") || "");
  const name = cleanName(formData.get("name"));
  const managerId = String(formData.get("managerId") || "") || null;
  if (!teamId) throw new Error("Missing team fields");

  const [users, teams] = await Promise.all([getUsers(), listTeams()]);
  const existing = teams.find((t) => t.id === teamId);
  if (!existing) throw new Error("Team not found");
  assertManager(users, managerId);
  assertUniqueName(teams, name, teamId);

  await updateTeam(teamId, { name, managerId });

  if (managerId && managerId !== existing.managerId) {
    await updateUser(managerId, { teamId });
  }

  revalidateTeamViews();
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
  revalidateTeamViews();
}

export async function deleteTeamAction(formData: FormData) {
  await requireAdmin();
  const teamId = String(formData.get("teamId") || "");
  if (!teamId) throw new Error("Missing team");

  const users = await getUsers();
  await Promise.all(
    users
      .filter((u) => u.teamId === teamId)
      .map((u) => updateUser(u.id, { teamId: null }))
  );
  await removeTeam(teamId);

  revalidatePath("/admin/teams");
  revalidatePath("/admin/users");
}

export type InviteTeamResult = {
  ok: boolean;
  emailed: boolean;
  inviteUrl: string;
  gmailComposeUrl: string | null;
  message: string;
};

export async function inviteToTeamAction(input: {
  email: string;
  teamId: string;
  role: string;
}): Promise<InviteTeamResult> {
  const session = await requireAdmin();
  const email = String(input.email || "")
    .trim()
    .toLowerCase();
  const teamId = String(input.teamId || "");
  const roleRaw = normalizeRole(input.role || "AGENT");
  const role: Role = (CRM_ROLES as readonly string[]).includes(roleRaw)
    ? roleRaw
    : "AGENT";

  if (!email || !email.includes("@")) {
    return {
      ok: false,
      emailed: false,
      inviteUrl: "",
      gmailComposeUrl: null,
      message: "A valid Gmail / email address is required",
    };
  }
  if (!teamId) {
    return {
      ok: false,
      emailed: false,
      inviteUrl: "",
      gmailComposeUrl: null,
      message: "Select a team",
    };
  }

  const team = await getTeam(teamId);
  if (!team) {
    return {
      ok: false,
      emailed: false,
      inviteUrl: "",
      gmailComposeUrl: null,
      message: "Team not found",
    };
  }

  const users = await getUsers();
  const existingUser = users.find((u) => u.email.toLowerCase() === email);
  if (existingUser) {
    await updateUser(existingUser.id, { teamId, role });
    revalidatePath("/admin/teams");
    revalidatePath("/admin/users");
    return {
      ok: true,
      emailed: false,
      inviteUrl: `${appBaseUrl()}/login`,
      gmailComposeUrl: null,
      message: `${existingUser.name} was added to ${team.name} as ${role}.`,
    };
  }

  const pending = await getPendingInviteByEmail(email);
  if (pending) {
    await updateInvite(pending.id, { teamId, role, status: "REVOKED" });
  }

  const token = randomBytes(24).toString("hex");
  await createInvite({
    email,
    teamId,
    role,
    token,
    invitedById: session.id,
  });

  const inviteUrl = `${appBaseUrl()}/signup?invite=${token}`;
  const subject = `You're invited to join ${team.name} on BINTEHMAS Real Estate CRM`;
  const text = [
    `You've been invited to join ${team.name} as ${role}.`,
    "",
    `1. Create your account: ${inviteUrl}`,
    "2. Verify your email using the Firebase verification link we send after signup",
    "   (or choose Continue with Google — Gmail is already verified).",
    "3. You'll then join the team with your assigned role.",
    "",
    "If you did not expect this invite, you can ignore this email.",
  ].join("\n");
  const html = `
      <p>You've been invited to join <strong>${team.name}</strong> as <strong>${role}</strong>.</p>
      <ol>
        <li><a href="${inviteUrl}">Create your account</a></li>
        <li>Verify your email (or sign in with Google)</li>
        <li>You'll join the team automatically</li>
      </ol>
      <p style="color:#64748b;font-size:12px">If you did not expect this invite, you can ignore this email.</p>
    `;

  let emailed = false;
  if (isGmailConfigured()) {
    try {
      await sendGmailInvite({ to: email, subject, text, html });
      emailed = true;
    } catch (err) {
      console.error("Gmail SMTP send failed", err);
    }
  }

  const composeUrl = gmailComposeUrl({ to: email, subject, body: text });

  revalidatePath("/admin/teams");
  revalidatePath("/admin/users");

  return {
    ok: true,
    emailed,
    inviteUrl,
    gmailComposeUrl: emailed ? null : composeUrl,
    message: emailed
      ? `Invite emailed to ${email}.`
      : `Invite created for ${email}. Open Gmail to send it, or copy the invite link.`,
  };
}

export async function revokeInviteAction(formData: FormData) {
  await requireAdmin();
  const inviteId = String(formData.get("inviteId") || "");
  if (!inviteId) throw new Error("Missing invite");
  await updateInvite(inviteId, { status: "REVOKED" });
  revalidatePath("/admin/teams");
}

export async function deleteInviteAction(formData: FormData) {
  await requireAdmin();
  const inviteId = String(formData.get("inviteId") || "");
  if (!inviteId) throw new Error("Missing invite");
  await removeInvite(inviteId);
  revalidatePath("/admin/teams");
}
