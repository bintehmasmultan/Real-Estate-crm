import { redirect } from "next/navigation";
import { WorkspacePanel } from "@/components/admin/workspace-panel";
import { getUsers, getUser, listTeams } from "@/lib/db/crm";
import { getSessionUser } from "@/lib/firebase/session";

export default async function AdminUsersPage() {
  const session = await getSessionUser();
  if (!session) return null;
  if (session.role !== "ADMIN") redirect("/dashboard");

  const [users, teams, me] = await Promise.all([
    getUsers(),
    listTeams(),
    getUser(session.id),
  ]);

  if (!me) return null;

  return <WorkspacePanel me={me} users={users} teams={teams} />;
}
