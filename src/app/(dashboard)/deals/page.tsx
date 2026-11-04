import Link from "next/link";
import { getSessionUser } from "@/lib/firebase/session";
import {
  getContact,
  getProperty,
  getUsers,
  listContacts,
  listDeals,
  listProperties,
  listStages,
} from "@/lib/db/crm";
import { canDeleteRecords, getTeamAgentIds } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { KanbanBoard } from "@/components/deals/kanban-board";
import { DealFormModal } from "@/components/deals/deal-form-modal";
import { fullName } from "@/lib/utils";

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ pipeline?: string }>;
}) {
  const session = await getSessionUser();
  if (!session) return null;
  const params = await searchParams;
  const pipeline = params.pipeline === "RENTALS" ? "RENTALS" : "SALES";

  const agentIds = await getTeamAgentIds({
    id: session.id,
    role: session.role,
    teamId: session.teamId,
  });

  const [stages, allDeals, contacts, properties, users] = await Promise.all([
    listStages(pipeline),
    listDeals(agentIds, pipeline),
    listContacts(agentIds),
    listProperties(agentIds),
    getUsers(),
  ]);

  const userMap = new Map(users.map((u) => [u.id, u]));

  const dealsEnriched = await Promise.all(
    allDeals.map(async (d) => ({
      ...d,
      canDelete: canDeleteRecords(session),
      contactId: d.contactId,
      contact: d.contactId ? await getContact(d.contactId) : null,
      property: d.propertyId ? await getProperty(d.propertyId) : null,
      agent: d.agentId ? userMap.get(d.agentId) : null,
    }))
  );

  const stagesForBoard = stages.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
    deals: dealsEnriched.filter((d) => d.stageId === s.id),
  }));

  const agents = users.map((u) => ({ id: u.id, name: u.name }));

  return (
    <div>
      <PageHeader
        title="Deals pipeline"
        description="Drag cards between stages to update progress"
        actions={
          <DealFormModal
            pipeline={pipeline}
            stages={stages.map((s) => ({ id: s.id, name: s.name }))}
            contacts={contacts.map((c) => ({
              id: c.id,
              name: fullName(c.firstName, c.lastName),
            }))}
            properties={properties.map((p) => ({ id: p.id, title: p.title }))}
            agents={agents}
          />
        }
      />

      <div className="mb-4 flex gap-2">
        <Link
          href="/deals?pipeline=SALES"
          className={`rounded-lg px-3 py-1.5 text-sm ${
            pipeline === "SALES"
              ? "bg-emerald-600 text-white"
              : "border border-slate-200 dark:border-slate-800"
          }`}
        >
          Sales
        </Link>
        <Link
          href="/deals?pipeline=RENTALS"
          className={`rounded-lg px-3 py-1.5 text-sm ${
            pipeline === "RENTALS"
              ? "bg-emerald-600 text-white"
              : "border border-slate-200 dark:border-slate-800"
          }`}
        >
          Rentals
        </Link>
      </div>

      <KanbanBoard stages={stagesForBoard} />
    </div>
  );
}
