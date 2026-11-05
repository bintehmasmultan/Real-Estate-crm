import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { isCrmRole, type Role } from "@/lib/constants";

export type SessionUser = {
  id: string;
  role: Role;
  teamId?: string | null;
};

export async function getTeamAgentIds(user: SessionUser) {
  if (!isCrmRole(user.role)) return [];
  if (user.role === "ADMIN") return null;
  if (user.role === "AGENT") return [user.id];

  if (!user.teamId) return [user.id];

  const snap = await getAdminDb()
    .collection("users")
    .where("teamId", "==", user.teamId)
    .get();

  return snap.docs.map((d: QueryDocumentSnapshot) => d.id);
}

export function inAgentScope(
  agentIds: string[] | null,
  fieldValue?: string | null
) {
  if (!agentIds) return true;
  if (!fieldValue) return false;
  return agentIds.includes(fieldValue);
}

/**
 * Admin can manage any record. Others can manage records they own
 * or that fall in their team agent scope.
 */
export function canManageAssigned(
  user: SessionUser,
  ownerId?: string | null,
  agentIds?: string[] | null
) {
  if (user.role === "ADMIN") return true;
  if (ownerId && ownerId === user.id) return true;
  if (agentIds === undefined) return false;
  return inAgentScope(agentIds, ownerId);
}

/** Hard delete is admin-only across CRM features. */
export function canDeleteRecords(user: SessionUser) {
  return user.role === "ADMIN";
}

/** @deprecated use canManageAssigned */
export function canManageProperty(
  user: SessionUser,
  listingAgentId?: string | null,
  agentIds?: string[] | null
) {
  return canManageAssigned(user, listingAgentId, agentIds);
}

export function canCreateProperty(user: SessionUser) {
  return isCrmRole(user.role);
}
