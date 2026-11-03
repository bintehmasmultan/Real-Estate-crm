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
