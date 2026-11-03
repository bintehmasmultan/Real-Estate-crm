import { getSessionUser } from "@/lib/firebase/session";
import { getUsers, listDeals, listLeads, listStages } from "@/lib/db/crm";
import { getTeamAgentIds } from "@/lib/rbac";
import { labelize } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportsCharts } from "@/components/reports/reports-charts";

export default async function ReportsPage() {
  const session = await getSessionUser();
  if (!session) return null;

  const agentIds = await getTeamAgentIds({
    id: session.id,
    role: session.role,
    teamId: session.teamId,
  });

  const [leads, stages, deals, users] = await Promise.all([
    listLeads(agentIds),
    listStages("SALES"),
    listDeals(agentIds),
    getUsers(),
  ]);

  const leadsBySourceMap = new Map<string, number>();
  for (const lead of leads) {
    leadsBySourceMap.set(
      lead.source,
      (leadsBySourceMap.get(lead.source) ?? 0) + 1
    );
  }
  const leadsBySource = [...leadsBySourceMap.entries()].map(([source, count]) => ({
    source,
    _count: { _all: count },
  }));

  const dealsByStage = stages.map((s) => ({
    name: s.name,
    count: deals.filter((d) => d.stageId === s.id).length,
  }));

  const agents = users.filter((u) =>
    agentIds ? agentIds.includes(u.id) : ["AGENT", "MANAGER"].includes(u.role)
  );

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
