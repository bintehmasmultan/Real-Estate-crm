import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeamAgentIds, taskAssigneeScopeWhere } from "@/lib/rbac";
import { formatDateTime } from "@/lib/utils";
import { labelize } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user) return null;

  const agentIds = await getTeamAgentIds({
    id: session.user.id,
    role: session.user.role,
    teamId: session.user.teamId,
  });

  const now = new Date();
  const horizon = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

  const [tasks, viewings] = await Promise.all([
    prisma.task.findMany({
      where: {
        ...taskAssigneeScopeWhere(agentIds),
        dueAt: { gte: now, lte: horizon },
        status: { in: ["TODO", "IN_PROGRESS"] },
      },
      include: { assignee: true },
      orderBy: { dueAt: "asc" },
    }),
    prisma.activity.findMany({
      where: {
        type: { in: ["VIEWING", "MEETING"] },
        scheduledAt: { gte: now, lte: horizon },
        ...(agentIds ? { createdById: { in: agentIds } } : {}),
      },
      include: { contact: true, property: true, createdBy: true },
      orderBy: { scheduledAt: "asc" },
    }),
  ]);

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
            {viewings.length === 0 ? (
              <p className="text-sm text-slate-500">Nothing scheduled</p>
            ) : (
              viewings.map((v) => (
                <div key={v.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{v.subject || labelize(v.type)}</p>
                    <Badge variant="info">{labelize(v.type)}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDateTime(v.scheduledAt)}
                    {v.contact ? ` · ${v.contact.firstName} ${v.contact.lastName}` : ""}
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
            {tasks.length === 0 ? (
              <p className="text-sm text-slate-500">No upcoming tasks</p>
            ) : (
              tasks.map((t) => (
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
