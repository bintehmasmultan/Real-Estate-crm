import Link from "next/link";
import {
  Users,
  Handshake,
  BadgeCheck,
  CircleDollarSign,
} from "lucide-react";
import { getSessionUser } from "@/lib/firebase/session";
import {
  countActiveDeals,
  countClosedThisMonth,
  countLeads,
  getContact,
  getUser,
  listActivities,
  listDeals,
  listStages,
  listTasks,
  sumPipelineValue,
} from "@/lib/db/crm";
import { getTeamAgentIds } from "@/lib/rbac";
import { formatCurrency, formatDateTime, fullName } from "@/lib/utils";
import { labelize } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PipelineChart } from "@/components/dashboard/pipeline-chart";

export default async function DashboardPage() {
  const session = await getSessionUser();
  if (!session) return null;

  const agentIds = await getTeamAgentIds({
    id: session.id,
    role: session.role,
    teamId: session.teamId,
  });

  const [
    totalLeads,
    activeDeals,
    closedThisMonth,
    pipelineValue,
    activities,
    allTasks,
    stages,
    deals,
  ] = await Promise.all([
    countLeads(agentIds),
    countActiveDeals(agentIds),
    countClosedThisMonth(agentIds),
    sumPipelineValue(agentIds),
    listActivities({
      createdByIds: agentIds,
      limit: 8,
    }),
    listTasks(agentIds),
    listStages("SALES"),
    listDeals(agentIds, "SALES"),
  ]);

  const upcomingTasks = allTasks
    .filter(
      (t) =>
        (t.status === "TODO" || t.status === "IN_PROGRESS") && t.dueAt
    )
    .slice(0, 6);

  const chartData = stages.map((stage) => {
    const stageDeals = deals.filter((d) => d.stageId === stage.id);
    return {
      name: stage.name,
      deals: stageDeals.length,
      value: stageDeals.reduce((s, d) => s + (d.value || 0), 0),
    };
  });

  const activityRows = await Promise.all(
    activities.map(async (a) => ({
      ...a,
      createdBy: a.createdById ? await getUser(a.createdById) : null,
      contact: a.contactId ? await getContact(a.contactId) : null,
    }))
  );

  const taskRows = await Promise.all(
    upcomingTasks.map(async (t) => ({
      ...t,
      assignee: t.assigneeId ? await getUser(t.assigneeId) : null,
    }))
  );

  const metrics = [
    {
      label: "Total Leads",
      value: totalLeads,
      icon: Users,
      href: "/leads",
    },
    {
      label: "Active Deals",
      value: activeDeals,
      icon: Handshake,
      href: "/deals",
    },
    {
      label: "Closed This Month",
      value: closedThisMonth,
      icon: BadgeCheck,
      href: "/reports",
    },
    {
      label: "Pipeline Value",
      value: formatCurrency(pipelineValue),
      icon: CircleDollarSign,
      href: "/deals",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Snapshot of your pipeline, activity, and upcoming work
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Link key={m.label} href={m.href}>
              <Card className="transition hover:border-emerald-300 hover:shadow-md dark:hover:border-emerald-700">
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm text-slate-500">{m.label}</p>
                    <p className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{m.value}</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <Icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Sales pipeline overview</CardTitle>
          </CardHeader>
          <CardContent>
            <PipelineChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {taskRows.length === 0 ? (
              <p className="text-sm text-slate-500">No upcoming tasks</p>
            ) : (
              taskRows.map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg border border-slate-100 p-3 dark:border-slate-800"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{task.title}</p>
                    <Badge
                      variant={
                        task.priority === "URGENT" || task.priority === "HIGH"
                          ? "warning"
                          : "secondary"
                      }
                    >
                      {labelize(task.priority)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Due {formatDateTime(task.dueAt)} ·{" "}
                    {task.assignee?.name ?? "Unassigned"}
                  </p>
                </div>
              ))
            )}
            <Link
              href="/tasks"
              className="text-sm font-medium text-emerald-600 hover:underline"
            >
              View all tasks
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activityRows.map((a) => (
            <div
              key={a.id}
              className="flex flex-col gap-1 rounded-lg border border-slate-100 p-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium">
                  {a.subject || labelize(a.type)}
                </p>
                <p className="text-xs text-slate-500">
                  {a.createdBy?.name ?? "System"}
                  {a.contact
                    ? ` · ${fullName(a.contact.firstName, a.contact.lastName)}`
                    : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="info">{labelize(a.type)}</Badge>
                <span className="text-xs text-slate-500">
                  {formatDateTime(a.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
