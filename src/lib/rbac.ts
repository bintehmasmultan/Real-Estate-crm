import { adminDb } from "@/lib/firebase/admin";
import type { Role } from "@/lib/constants";

export type SessionUser = {
  id: string;
  role: Role;
  teamId?: string | null;
};

export async function getTeamAgentIds(user: SessionUser) {
  if (user.role === "ADMIN") return null;
  if (user.role === "AGENT") return [user.id];

  if (!user.teamId) return [user.id];

  const snap = await adminDb
    .collection("users")
    .where("teamId", "==", user.teamId)
    .get();

  return snap.docs.map((d) => d.id);
}

export function inAgentScope(
  agentIds: string[] | null,
  fieldValue?: string | null
) {
  if (!agentIds) return true;
  if (!fieldValue) return false;
  return agentIds.includes(fieldValue);
}
