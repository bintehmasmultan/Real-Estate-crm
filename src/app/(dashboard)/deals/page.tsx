import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeamAgentIds, dealAgentScopeWhere } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { KanbanBoard } from "@/components/deals/kanban-board";
import { DealFormModal } from "@/components/deals/deal-form-modal";
import { fullName } from "@/lib/utils";

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ pipeline?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const params = await searchParams;
  const pipeline = params.pipeline === "RENTALS" ? "RENTALS" : "SALES";

  const agentIds = await getTeamAgentIds({
    id: session.user.id,
    role: session.user.role,
    teamId: session.user.teamId,
  });

  const [stages, contacts, properties, agents] = await Promise.all([
    prisma.pipelineStage.findMany({
      where: { pipeline },
      orderBy: { order: "asc" },
      include: {
        deals: {
          where: dealAgentScopeWhere(agentIds),
          include: {
            contact: true,
            property: true,
            agent: true,
          },
          orderBy: { updatedAt: "desc" },
        },
      },
    }),
    prisma.contact.findMany({
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
    prisma.property.findMany({
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
    prisma.user.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

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
            properties={properties}
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

      <KanbanBoard
        stages={stages.map((s) => ({
          id: s.id,
          name: s.name,
          color: s.color,
          deals: s.deals,
        }))}
      />
    </div>
  );
}
