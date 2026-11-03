import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeamAgentIds, dealAgentScopeWhere, agentScopeWhere } from "@/lib/rbac";
import { labelize } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportsCharts } from "@/components/reports/reports-charts";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const agentIds = await getTeamAgentIds({
    id: session.user.id,
    role: session.user.role,
    teamId: session.user.teamId,
  });

  const [leadsBySource, stages, deals, agents] = await Promise.all([
    prisma.lead.groupBy({
      by: ["source"],
      where: agentScopeWhere(agentIds),
      _count: { _all: true },
    }),
    prisma.pipelineStage.findMany({
      where: { pipeline: "SALES" },
      orderBy: { order: "asc" },
    }),
    prisma.deal.findMany({
      where: dealAgentScopeWhere(agentIds),
      select: { stageId: true, agentId: true, value: true, closedAt: true },
    }),
    prisma.user.findMany({
      where: agentIds ? { id: { in: agentIds } } : { role: { in: ["AGENT", "MANAGER"] } },
      select: { id: true, name: true },
    }),
  ]);

  const dealsByStage = stages.map((s) => ({
    name: s.name,
    count: deals.filter((d) => d.stageId === s.id).length,
  }));

  const agentPerf = agents.map((a) => {
    const agentDeals = deals.filter((d) => d.agentId === a.id);
    return {
      name: a.name.split(" ")[0],
      deals: agentDeals.length,
      closed: agentDeals.filter((d) => d.closedAt).length,
      value: agentDeals.reduce((sum, d) => sum + d.value, 0),
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Leads by source, pipeline distribution, and agent performance"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Leads by source</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {leadsBySource.map((row) => (
              <div key={row.source} className="flex items-center justify-between rounded-lg border p-2">
                <span>{labelize(row.source)}</span>
                <span className="font-semibold">{row._count._all}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Charts</CardTitle></CardHeader>
          <CardContent>
            <ReportsCharts
              leadsBySource={leadsBySource.map((r) => ({
                name: labelize(r.source),
                value: r._count._all,
              }))}
              dealsByStage={dealsByStage}
              agentPerf={agentPerf}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
