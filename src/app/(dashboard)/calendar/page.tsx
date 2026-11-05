import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
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

type CalendarEvent = {
  id: string;
  at: string;
  day: string;
  title: string;
  kind: "TASK" | "VIEWING" | "MEETING";
  detail: string;
  openTask: boolean;
  assigneeId?: string | null;
  contactId?: string | null;
  propertyId?: string | null;
};

function monthStartFromParam(value: string | undefined) {
  const match = /^(\d{4})-(\d{2})$/.exec(value || "");
  if (!match) return startOfMonth(new Date());
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return startOfMonth(new Date());
  return new Date(year, month - 1, 1);
}

function dayKey(value: string) {
  const parsed = parseISO(value);
  if (!isValid(parsed)) return null;
  return format(parsed, "yyyy-MM-dd");
}

async function describeEvents(events: CalendarEvent[]) {
  return Promise.all(
    events.map(async (event) => {
      const [assignee, contact, property] = await Promise.all([
        event.assigneeId ? getUser(event.assigneeId) : null,
        event.contactId ? getContact(event.contactId) : null,
        event.propertyId ? getProperty(event.propertyId) : null,
      ]);
      const extra = [
        event.kind === "TASK" ? assignee?.name || "Unassigned" : null,
        contact ? `${contact.firstName} ${contact.lastName}` : null,
        property?.title,
      ].filter(Boolean);
      return {
        ...event,
        detail: [event.detail, ...extra].filter(Boolean).join(" · "),
      };
    })
  );
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; day?: string }>;
}) {
  const session = await getSessionUser();
  if (!session) return null;

  const params = await searchParams;
  const monthStart = monthStartFromParam(
    typeof params.month === "string" ? params.month : undefined
  );
  const monthKey = format(monthStart, "yyyy-MM");
  const requestedDay =
    typeof params.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.day)
      ? params.day
      : format(new Date(), "yyyy-MM-dd");
  const selectedDay = requestedDay.startsWith(monthKey)
    ? requestedDay
    : format(monthStart, "yyyy-MM-dd");

  const agentIds = await getTeamAgentIds({
    id: session.id,
    role: session.role,
    teamId: session.teamId,
  });

  const [allTasks, allActivities] = await Promise.all([
    listTasks(agentIds),
    listActivities({ createdByIds: agentIds }),
  ]);

  const taskEvents: CalendarEvent[] = allTasks.flatMap((task) => {
    if (!task.dueAt) return [];
    const day = dayKey(task.dueAt);
    if (!day) return [];
    return [
      {
        id: task.id,
        at: task.dueAt,
        day,
        title: task.title,
        kind: "TASK" as const,
        detail: labelize(task.priority),
        openTask: task.status === "TODO" || task.status === "IN_PROGRESS",
        assigneeId: task.assigneeId,
        contactId: null,
        propertyId: null,
      },
    ];
  });

  const meetingEvents: CalendarEvent[] = allActivities.flatMap((activity) => {
    if (activity.type !== "VIEWING" && activity.type !== "MEETING") return [];
    if (!activity.scheduledAt) return [];
    const day = dayKey(activity.scheduledAt);
    if (!day) return [];
    return [
      {
        id: activity.id,
        at: activity.scheduledAt,
        day,
        title: activity.subject || labelize(activity.type),
        kind: activity.type,
        detail: "",
        openTask: false,
        assigneeId: null,
        contactId: activity.contactId,
        propertyId: activity.propertyId,
      },
    ];
  });

  const events: CalendarEvent[] = [...taskEvents, ...meetingEvents].sort((a, b) =>
    a.at.localeCompare(b.at)
  );
  const inMonth = events.filter((event) => event.day.startsWith(monthKey));
  const byDay = new Map<string, CalendarEvent[]>();
  for (const event of inMonth) {
    const list = byDay.get(event.day) ?? [];
    list.push(event);
    byDay.set(event.day, list);
  }

  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const selectedEvents = await describeEvents(byDay.get(selectedDay) ?? []);
  const overdue = await describeEvents(
    taskEvents.filter((event) => event.openTask && event.day < todayKey).slice(0, 8)
  );

  const prev = format(addMonths(monthStart, -1), "yyyy-MM");
  const next = format(addMonths(monthStart, 1), "yyyy-MM");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="Tasks, viewings, and meetings for the month"
        actions={
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Link
              href={`/calendar?month=${prev}`}
              className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              Previous
            </Link>
            <span className="min-w-0 flex-1 text-center text-sm font-medium sm:min-w-32 sm:flex-none">
              {format(monthStart, "MMMM yyyy")}
            </span>
            <Link
              href={`/calendar?month=${next}`}
              className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              Next
            </Link>
          </div>
        }
      />

      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wide text-slate-500">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
              <div key={label} className="py-1">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const items = byDay.get(key) ?? [];
              const inThisMonth = isSameMonth(day, monthStart);
              const selected = key === selectedDay;
              return (
                <Link
                  key={key}
                  href={`/calendar?month=${monthKey}&day=${key}`}
                  className={`min-h-16 rounded-lg border p-1.5 text-left sm:min-h-24 ${
                    selected
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                      : "border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                  } ${inThisMonth ? "" : "opacity-40"}`}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      key === todayKey ? "bg-emerald-600 text-white" : ""
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-1">
                    {items.slice(0, 2).map((event) => (
                      <p
                        key={event.id}
                        className="truncate rounded bg-slate-100 px-1 text-[10px] leading-4 dark:bg-slate-800"
                      >
                        {event.title}
                      </p>
                    ))}
                    {items.length > 2 ? (
                      <p className="text-[10px] text-slate-500">+{items.length - 2}</p>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {format(parseISO(selectedDay), "d MMM yyyy")}
              {isSameDay(parseISO(selectedDay), new Date()) ? " · Today" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedEvents.length === 0 ? (
              <p className="text-sm text-slate-500">Nothing scheduled</p>
            ) : (
              selectedEvents.map((event) => (
                <div key={event.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{event.title}</p>
                    <Badge variant={event.kind === "TASK" ? "warning" : "info"}>
                      {labelize(event.kind)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDateTime(event.at)}
                    {event.detail ? ` · ${event.detail}` : ""}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overdue tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overdue.length === 0 ? (
              <p className="text-sm text-slate-500">No overdue tasks</p>
            ) : (
              overdue.slice(0, 8).map((event) => (
                <Link
                  key={event.id}
                  href={`/calendar?month=${event.day.slice(0, 7)}&day=${event.day}`}
                  className="block rounded-lg border p-3 hover:border-amber-300"
                >
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDateTime(event.at)} · {event.detail}
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
