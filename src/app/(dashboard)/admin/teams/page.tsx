import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getUsers, listInvites, listTeams } from "@/lib/db/crm";
import { isGmailConfigured } from "@/lib/mail/gmail";
import {
  createTeamAction,
  deleteInviteAction,
  deleteTeamAction,
  revokeInviteAction,
  updateTeamAction,
} from "@/app/actions/teams";
import { InviteToTeamForm } from "@/components/admin/invite-to-team-form";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export default async function AdminTeamsPage() {
  const session = await getSessionUser();
  if (!session) return null;
  if (session.role !== "ADMIN") redirect("/dashboard");

  const [teams, users, invites] = await Promise.all([
    listTeams(),
    getUsers(),
    listInvites(),
  ]);
  const managers = users.filter(
    (u) => u.role === "MANAGER" || u.role === "ADMIN" || u.role === "AGENT"
  );
  const pendingInvites = invites.filter((i) => i.status === "PENDING");
  const teamName = Object.fromEntries(teams.map((t) => [t.id, t.name]));
  const gmailReady = isGmailConfigured();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teams"
        description="Create teams, invite members by Gmail, and manage membership"
      />

      <Card>
        <CardHeader>
          <CardTitle>Create team</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTeamAction} className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1 sm:col-span-1">
              <Label>Name</Label>
              <Input name="name" required placeholder="Lahore Sales" />
            </div>
            <div className="space-y-1 sm:col-span-1">
              <Label>Manager</Label>
              <Select name="managerId" defaultValue="">
                <option value="">Unassigned</option>
                {managers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full sm:w-auto">
                Add team
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invite to team via Gmail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-500">
            {gmailReady
              ? "Invites are emailed automatically from your configured Gmail account."
              : "After you invite, Gmail compose opens with the invite ready to send. You can also copy the signup link. Optional: set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local for fully automatic sending."}
          </p>
          <InviteToTeamForm
            teams={teams.map((t) => ({ id: t.id, name: t.name }))}
          />
          {pendingInvites.length > 0 ? (
            <div className="space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <p className="text-sm font-medium">Pending invites</p>
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <span>
                    {invite.email} → {teamName[invite.teamId] || "Team"} (
                    {invite.role})
                  </span>
                  <div className="flex gap-2">
                    <form action={revokeInviteAction}>
                      <input type="hidden" name="inviteId" value={invite.id} />
                      <Button type="submit" size="sm" variant="outline">
                        Revoke
                      </Button>
                    </form>
                    <form action={deleteInviteAction}>
                      <input type="hidden" name="inviteId" value={invite.id} />
                      <Button type="submit" size="sm" variant="outline">
                        Delete
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing teams</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          {teams.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No teams yet</p>
          ) : (
            teams.map((team) => {
              const members = users.filter((u) => u.teamId === team.id);
              const manager = users.find((u) => u.id === team.managerId);
              return (
                <div
                  key={team.id}
                  className="border-t border-slate-100 p-4 dark:border-slate-800"
                >
                  <form
                    action={updateTeamAction}
                    className="grid gap-3 sm:grid-cols-3"
                  >
                    <input type="hidden" name="teamId" value={team.id} />
                    <div className="space-y-1">
                      <Label>Name</Label>
                      <Input name="name" required defaultValue={team.name} />
                    </div>
                    <div className="space-y-1">
                      <Label>Manager</Label>
                      <Select
                        name="managerId"
                        defaultValue={team.managerId ?? ""}
                      >
                        <option value="">Unassigned</option>
                        {managers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="flex items-end gap-2">
                      <Button type="submit" size="sm">
                        Save
                      </Button>
                      <Button
                        formAction={deleteTeamAction}
                        type="submit"
                        size="sm"
                        variant="outline"
                      >
                        Delete
                      </Button>
                    </div>
                  </form>
                  <p className="mt-2 text-xs text-slate-500">
                    Manager: {manager?.name || "—"} · Members:{" "}
                    {members.length
                      ? members.map((m) => m.name).join(", ")
                      : "none"}
                  </p>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
