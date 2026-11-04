import { getSessionUser } from "@/lib/firebase/session";
import { getContact, getDeal, getUsers, listTasks } from "@/lib/db/crm";
import { canDeleteRecords, getTeamAgentIds } from "@/lib/rbac";
import { formatDateTime } from "@/lib/utils";
import { labelize } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { TaskFormModal } from "@/components/tasks/task-form-modal";
import { TaskToggle } from "@/components/tasks/task-toggle";
import { TaskDeleteButton } from "@/components/tasks/task-delete-button";

export default async function TasksPage() {
  const session = await getSessionUser();
  if (!session) return null;

  const agentIds = await getTeamAgentIds({
    id: session.id,
    role: session.role,
    teamId: session.teamId,
  });

  const [tasks, users] = await Promise.all([
    listTasks(agentIds),
    getUsers(),
  ]);

  const userMap = new Map(users.map((u) => [u.id, u]));
  const agents = users.map((u) => ({ id: u.id, name: u.name }));

  const taskRows = await Promise.all(
    tasks.map(async (task) => ({
      ...task,
      assignee: task.assigneeId ? userMap.get(task.assigneeId) : null,
      contact: task.contactId ? await getContact(task.contactId) : null,
      deal: task.dealId ? await getDeal(task.dealId) : null,
    }))
  );

  const sorted = [...taskRows].sort((a, b) => {
    if (a.status !== b.status) return a.status.localeCompare(b.status);
    return (a.dueAt || "").localeCompare(b.dueAt || "");
  });

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Follow-ups, viewings, and to-dos"
        actions={<TaskFormModal agents={agents} />}
      />

      {sorted.length === 0 ? (
        <EmptyState title="No tasks yet" />
      ) : (
        <div className="space-y-3">
          {sorted.map((task) => (
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
                    {task.contact
                      ? ` · ${task.contact.firstName} ${task.contact.lastName}`
                      : ""}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
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
                {canDeleteRecords(session) ? (
                  <TaskDeleteButton id={task.id} title={task.title} />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
