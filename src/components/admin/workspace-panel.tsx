import { assignUserTeam, createTeamAction, updateTeamAction } from "@/app/actions/teams";
import { updateOwnProfile, updateUserRole } from "@/app/actions/users";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ROLES, labelize, normalizeRole } from "@/lib/constants";
import type { AppUser, Team } from "@/lib/types";

function managerChoices(users: AppUser[], currentId?: string | null) {
  return users.filter(
    (user) =>
      user.role === "ADMIN" || user.role === "MANAGER" || user.id === currentId
  );
}

export function WorkspacePanel({
  me,
  users,
  teams,
}: {
  me: AppUser;
  users: AppUser[];
  teams: Team[];
}) {
  const teamName = new Map(teams.map((team) => [team.id, team.name]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="People and teams"
        description="Edit your profile, rename teams, and add people to a team"
      />

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Your profile</CardTitle>
            <CardDescription>This name appears in the header and activity.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateOwnProfile} className="grid gap-3">
              <div>
                <Label htmlFor="profile-name">Name</Label>
                <Input
                  id="profile-name"
                  name="name"
                  required
                  minLength={2}
                  maxLength={80}
                  defaultValue={me.name}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="profile-phone">Phone</Label>
                <Input
                  id="profile-phone"
                  name="phone"
                  maxLength={40}
                  defaultValue={me.phone ?? ""}
                  placeholder="+92 300 0000000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  value={me.email}
                  readOnly
                  className="mt-1 bg-slate-50 text-slate-500 dark:bg-slate-950"
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Badge variant="info">{labelize(me.role)}</Badge>
                <Button type="submit" className="w-full sm:w-auto">
                  Save profile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>New team</CardTitle>
            <CardDescription>
              A manager added here is also placed on the team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createTeamAction} className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <Label htmlFor="new-team-name">Team name</Label>
                <Input
                  id="new-team-name"
                  name="name"
                  required
                  minLength={2}
                  maxLength={80}
                  placeholder="Lahore sales"
                  className="mt-1"
                />
              </div>
              <div className="sm:col-span-1">
                <Label htmlFor="new-team-manager">Manager</Label>
                <Select id="new-team-manager" name="managerId" defaultValue="" className="mt-1">
                  <option value="">No manager yet</option>
                  {managerChoices(users).map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" className="w-full sm:w-auto">
                  Create team
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Teams</h2>
        {teams.length === 0 ? (
          <EmptyState
            title="No teams yet"
            description="Create a team, then add managers and agents."
          />
        ) : (
          <div className="grid gap-4">
            {teams.map((team) => {
              const members = users.filter((user) => user.teamId === team.id);
              const candidates = users.filter((user) => user.teamId !== team.id);
              return (
                <Card key={team.id}>
                  <CardContent className="grid gap-5 pt-5 lg:grid-cols-2">
                    <form action={updateTeamAction} className="grid content-start gap-3">
                      <input type="hidden" name="teamId" value={team.id} />
                      <div>
                        <Label htmlFor={`team-name-${team.id}`}>Team name</Label>
                        <Input
                          id={`team-name-${team.id}`}
                          name="name"
                          required
                          minLength={2}
                          maxLength={80}
                          defaultValue={team.name}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`team-manager-${team.id}`}>Manager</Label>
                        <Select
                          id={`team-manager-${team.id}`}
                          name="managerId"
                          defaultValue={team.managerId ?? ""}
                          className="mt-1"
                        >
                          <option value="">No manager</option>
                          {managerChoices(users, team.managerId).map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <Button type="submit" variant="secondary" className="w-full sm:w-auto">
                        Save team
                      </Button>
                    </form>

                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        Members
                        <span className="ml-2 text-slate-500">{members.length}</span>
                      </p>
                      <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
                        {members.length === 0 ? (
                          <li className="py-3 text-sm text-slate-500">No one on this team yet</li>
                        ) : (
                          members.map((member) => (
                            <li
                              key={member.id}
                              className="flex items-center justify-between gap-3 py-2.5"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{member.name}</p>
                                <p className="truncate text-xs text-slate-500">
                                  {member.email} · {labelize(normalizeRole(member.role))}
                                </p>
                              </div>
                              <form action={assignUserTeam}>
                                <input type="hidden" name="userId" value={member.id} />
                                <input type="hidden" name="teamId" value="" />
                                <Button type="submit" size="sm" variant="outline">
                                  Remove
                                </Button>
                              </form>
                            </li>
                          ))
                        )}
                      </ul>
                      <form action={assignUserTeam} className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <input type="hidden" name="teamId" value={team.id} />
                        <Select name="userId" defaultValue="" className="sm:min-w-0 sm:flex-1">
                          <option value="">Add someone</option>
                          {candidates.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name}
                              {user.teamId
                                ? ` · ${teamName.get(user.teamId) ?? "Other team"}`
                                : ""}
                            </option>
                          ))}
                        </Select>
                        <Button type="submit" className="sm:shrink-0">
                          Add to team
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Access</CardTitle>
          <CardDescription>
            Pending signups stay out of the CRM until you assign a role. Your own role stays admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {users.length === 0 ? (
            <p className="text-sm text-slate-500">No users yet</p>
          ) : (
            users.map((user) => {
              const role = normalizeRole(user.role);
              const isSelf = user.id === me.id;
              return (
                <div
                  key={user.id}
                  className="grid gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] lg:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {user.name}
                      {isSelf ? <span className="text-slate-500"> · You</span> : null}
                    </p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {user.teamId ? teamName.get(user.teamId) ?? "Unknown team" : "No team"}
                    </p>
                  </div>
                  <form action={updateUserRole} className="flex flex-col gap-2 sm:flex-row">
                    <input type="hidden" name="userId" value={user.id} />
                    {role === "PENDING" ? <Badge variant="warning">Pending</Badge> : null}
                    <Select
                      name="role"
                      defaultValue={role}
                      disabled={isSelf}
                      aria-label={`Role for ${user.name}`}
                      className="sm:min-w-0 sm:flex-1"
                    >
                      {ROLES.map((option) => (
                        <option key={option} value={option}>
                          {labelize(option)}
                        </option>
                      ))}
                    </Select>
                    <Button type="submit" size="sm" disabled={isSelf} className="sm:shrink-0">
                      {isSelf ? "Locked" : "Save role"}
                    </Button>
                  </form>
                  <form action={assignUserTeam} className="flex flex-col gap-2 sm:flex-row">
                    <input type="hidden" name="userId" value={user.id} />
                    <Select
                      name="teamId"
                      defaultValue={user.teamId ?? ""}
                      aria-label={`Team for ${user.name}`}
                      className="sm:min-w-0 sm:flex-1"
                    >
                      <option value="">No team</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </Select>
                    <Button type="submit" size="sm" variant="secondary" className="sm:shrink-0">
                      Save team
                    </Button>
                  </form>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
