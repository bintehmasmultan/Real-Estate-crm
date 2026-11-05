import { getSessionUser } from "@/lib/firebase/session";
import { getUser, listTeams } from "@/lib/db/crm";
import { updateOwnProfile } from "@/app/actions/users";
import { labelize } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default async function ProfileSettingsPage() {
  const session = await getSessionUser();
  if (!session) return null;

  const [user, teams] = await Promise.all([getUser(session.id), listTeams()]);
  if (!user) return null;

  const team = teams.find((t) => t.id === user.teamId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My profile"
        description="Update your display name and phone. Role and team are managed by an admin."
      />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Account details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="info">{labelize(user.role)}</Badge>
            <Badge variant="secondary">{team?.name || "No team"}</Badge>
          </div>
          <form action={updateOwnProfile} className="space-y-4">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={user.email} disabled />
            </div>
            <div className="space-y-1">
              <Label>Full name</Label>
              <Input name="name" required defaultValue={user.name} />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input name="phone" defaultValue={user.phone ?? ""} />
            </div>
            <Button type="submit">Save profile</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
