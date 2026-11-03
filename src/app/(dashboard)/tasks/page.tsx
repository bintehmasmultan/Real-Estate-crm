import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeamAgentIds, taskAssigneeScopeWhere } from "@/lib/rbac";
import { formatDateTime } from "@/lib/utils";
import { labelize } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { TaskFormModal } from "@/components/tasks/task-form-modal";
import { TaskToggle } from "@/components/tasks/task-toggle";

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user) return null;

  const agentIds = await getTeamAgentIds({
    id: session.user.id,
    role: session.user.role,
    teamId: session.user.teamId,
  });

  const [tasks, agents] = await Promise.all([
    prisma.task.findMany({
      where: taskAssigneeScopeWhere(agentIds),
      include: { assignee: true, contact: true, deal: true },
      orderBy: [{ status: "asc" }, { dueAt: "asc" }],
    }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Follow-ups, viewings, and to-dos"
        actions={<TaskFormModal agents={agents} />}
      />

      {tasks.length === 0 ? (
        <EmptyState title="No tasks yet" />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <TaskToggle id={task.id} done={task.status === "DONE"} />
                <div>
                  <p className={`font-medium ${task.status === "DONE" ? "line-through text-slate-400" : ""}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {task.assignee?.name || "Unassigned"}
                    {task.dueAt ? ` · due ${formatDateTime(task.dueAt)}` : ""}
                    {task.contact ? ` · ${task.contact.firstName} ${task.contact.lastName}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge
                  variant={
                    task.priority === "URGENT" || task.priority === "HIGH"
                      ? "warning"
                      : "secondary"
                  }
                >
                  {labelize(task.priority)}
                </Badge>
                <Badge variant="info">{labelize(task.status)}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
