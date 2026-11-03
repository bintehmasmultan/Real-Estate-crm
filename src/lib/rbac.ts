import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/constants";

export type SessionUser = {
  id: string;
  role: Role;
  teamId?: string | null;
};

export async function getTeamAgentIds(user: SessionUser) {
  if (user.role === "ADMIN") return null; // null = no filter (all)
  if (user.role === "AGENT") return [user.id];

  if (!user.teamId) return [user.id];

  const members = await prisma.user.findMany({
    where: { teamId: user.teamId },
    select: { id: true },
  });
  return members.map((m) => m.id);
}

export function agentScopeWhere(agentIds: string[] | null, field = "assignedAgentId") {
  if (!agentIds) return {};
  return { [field]: { in: agentIds } };
}

export function dealAgentScopeWhere(agentIds: string[] | null) {
  if (!agentIds) return {};
  return { agentId: { in: agentIds } };
}

export function propertyAgentScopeWhere(agentIds: string[] | null) {
  if (!agentIds) return {};
  return { listingAgentId: { in: agentIds } };
}

export function taskAssigneeScopeWhere(agentIds: string[] | null) {
  if (!agentIds) return {};
  return { assigneeId: { in: agentIds } };
}

export function canManageUsers(role: Role) {
  return role === "ADMIN";
}
