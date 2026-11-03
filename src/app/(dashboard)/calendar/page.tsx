import { getSessionUser } from "@/lib/firebase/session";
import {
  getContact,
  getProperty,
  getUser,
  listActivities,
  listTasks,
} from "@/lib/db/crm";
import { getTeamAgentIds } from "@/lib/rbac";
import { formatDateTime } from "@/lib/utils";
import { labelize } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CalendarPage() {
  const session = await getSessionUser();
  if (!session) return null;

  const agentIds = await getTeamAgentIds({
    id: session.id,
    role: session.role,
    teamId: session.teamId,
  });

  const now = new Date();
  const horizon = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  const nowIso = now.toISOString();
  const horizonIso = horizon.toISOString();

  const [allTasks, allActivities] = await Promise.all([
    listTasks(agentIds),
    listActivities({ createdByIds: agentIds }),
  ]);

  const tasks = allTasks
    .filter(
      (t) =>
        t.dueAt &&
        t.dueAt >= nowIso &&
        t.dueAt <= horizonIso &&
        (t.status === "TODO" || t.status === "IN_PROGRESS")
    )
    .sort((a, b) => (a.dueAt || "").localeCompare(b.dueAt || ""));

  const viewings = allActivities
    .filter(
      (a) =>
        (a.type === "VIEWING" || a.type === "MEETING") &&
        a.scheduledAt &&
        a.scheduledAt >= nowIso &&
        a.scheduledAt <= horizonIso
    )
    .sort((a, b) => (a.scheduledAt || "").localeCompare(b.scheduledAt || ""));

  const taskRows = await Promise.all(
    tasks.map(async (t) => ({
      ...t,
      assignee: t.assigneeId ? await getUser(t.assigneeId) : null,
    }))
  );

  const viewingRows = await Promise.all(
    viewings.map(async (v) => ({
      ...v,
      contact: v.contactId ? await getContact(v.contactId) : null,
      property: v.propertyId ? await getProperty(v.propertyId) : null,
      createdBy: v.createdById ? await getUser(v.createdById) : null,
    }))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="Upcoming viewings, meetings, and follow-ups (next 30 days)"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Viewings & meetings</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {viewingRows.length === 0 ? (
              <p className="text-sm text-slate-500">Nothing scheduled</p>
            ) : (
              viewingRows.map((v) => (
                <div key={v.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{v.subject || labelize(v.type)}</p>
                    <Badge variant="info">{labelize(v.type)}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDateTime(v.scheduledAt)}
                    {v.contact
                      ? ` · ${v.contact.firstName} ${v.contact.lastName}`
                      : ""}
                    {v.property ? ` · ${v.property.title}` : ""}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Follow-up tasks</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {taskRows.length === 0 ? (
              <p className="text-sm text-slate-500">No upcoming tasks</p>
            ) : (
              taskRows.map((t) => (
                <div key={t.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{t.title}</p>
                    <Badge variant="warning">{labelize(t.priority)}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDateTime(t.dueAt)} · {t.assignee?.name || "Unassigned"}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
