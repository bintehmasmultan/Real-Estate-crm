import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getUsers, listTeams } from "@/lib/db/crm";
import { ROLES, labelize, normalizeRole } from "@/lib/constants";
import { updateUserRole, updateUserTeam } from "@/app/actions/users";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

export default async function AdminUsersPage() {
  const session = await getSessionUser();
  if (!session) return null;
  if (session.role !== "ADMIN") redirect("/dashboard");

  const [users, teams] = await Promise.all([getUsers(), listTeams()]);
  const teamName = Object.fromEntries(teams.map((t) => [t.id, t.name]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team access"
        description="Assign roles and place users on teams. Self-signups stay pending until approved."
      />
      <Card>
        <CardContent className="divide-y p-0">
          {users.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No users yet</p>
          ) : (
            users.map((user) => {
              const role = normalizeRole(user.role);
              const isSelf = user.id === session.id;
              return (
                <div
                  key={user.id}
                  className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Team: {user.teamId ? teamName[user.teamId] || "Unknown" : "Unassigned"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <form action={updateUserRole} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={user.id} />
                      {role === "PENDING" ? (
                        <Badge variant="warning">Pending</Badge>
                      ) : null}
                      <Select name="role" defaultValue={role} disabled={isSelf} className="w-36">
                        {ROLES.map((option) => (
                          <option key={option} value={option}>
                            {labelize(option)}
                          </option>
                        ))}
                      </Select>
                      <Button type="submit" size="sm" disabled={isSelf}>
                        {isSelf ? "You" : "Save role"}
                      </Button>
                    </form>
                    <form action={updateUserTeam} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={user.id} />
                      <Select
                        name="teamId"
                        defaultValue={user.teamId ?? ""}
                        className="w-44"
                      >
                        <option value="">No team</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </Select>
                      <Button type="submit" size="sm" variant="outline">
                        Save team
                      </Button>
                    </form>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
