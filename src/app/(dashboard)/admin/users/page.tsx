import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getUsers } from "@/lib/db/crm";
import { ROLES, labelize, normalizeRole } from "@/lib/constants";
import { updateUserRole } from "@/app/actions/users";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

export default async function AdminUsersPage() {
  const session = await getSessionUser();
  if (!session) return null;
  if (session.role !== "ADMIN") redirect("/dashboard");

  const users = await getUsers();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team access"
        description="Self-signups stay pending until you assign Admin, Manager, or Agent"
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
                <form
                  key={user.id}
                  action={updateUserRole}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <input type="hidden" name="userId" value={user.id} />
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
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
                      {isSelf ? "You" : "Save"}
                    </Button>
                  </div>
                </form>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
