import { getSessionUser } from "@/lib/firebase/session";
import { getUsers, listDeals, listLeads, listStages } from "@/lib/db/crm";
import { getTeamAgentIds } from "@/lib/rbac";
import { LEAD_STATUSES, labelize } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
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

  const [leads, salesStages, rentalStages, deals, users] = await Promise.all([
    listLeads(agentIds),
    listStages("SALES"),
    listStages("RENTALS"),
    listDeals(agentIds),
    getUsers(),
  ]);

  const leadsBySourceMap = new Map<string, number>();
  for (const lead of leads) {
    leadsBySourceMap.set(lead.source, (leadsBySourceMap.get(lead.source) ?? 0) + 1);
  }
  const leadsBySource = [...leadsBySourceMap.entries()].map(([source, count]) => ({
    source,
    count,
  }));

  const leadStatus = LEAD_STATUSES.map((status) => ({
    name: labelize(status),
    count: leads.filter((lead) => lead.status === status).length,
  })).filter((row) => row.count > 0);

  const stageCounts = (stages: { id: string; name: string }[], pipeline: string) =>
    stages.map((stage) => ({
      name: stage.name,
      count: deals.filter((deal) => deal.pipeline === pipeline && deal.stageId === stage.id)
        .length,
    }));

  const openDeals = deals.filter((deal) => !deal.closedAt);
  const closedDeals = deals.filter((deal) => deal.closedAt);
  const converted = leads.filter((lead) => lead.status === "CONVERTED").length;
  const conversion = leads.length ? Math.round((converted / leads.length) * 100) : 0;
  const openValue = openDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
  const closedValue = closedDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);

  const agents = users.filter((user) =>
    agentIds
      ? agentIds.includes(user.id)
      : user.role === "AGENT" || user.role === "MANAGER"
  );

  const agentPerf = agents.map((agent) => {
    const agentDeals = deals.filter((deal) => deal.agentId === agent.id);
    return {
      name: agent.name.split(" ")[0],
      fullName: agent.name,
      deals: agentDeals.length,
      closed: agentDeals.filter((deal) => deal.closedAt).length,
      value: agentDeals.reduce((sum, deal) => sum + deal.value, 0),
    };
  });

  const metrics = [
    { label: "Leads", value: String(leads.length) },
    { label: "Conversion", value: `${conversion}%` },
    { label: "Open pipeline", value: formatCurrency(openValue) },
    { label: "Closed value", value: formatCurrency(closedValue) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Lead conversion, sales and rental pipelines, and agent results"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">{metric.label}</p>
              <p className="mt-1 text-2xl font-semibold">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Leads by source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {leadsBySource.length === 0 ? (
              <p className="text-sm text-slate-500">No leads yet</p>
            ) : (
              leadsBySource.map((row) => (
                <div key={row.source} className="flex items-center justify-between rounded-lg border p-2">
                  <span>{labelize(row.source)}</span>
                  <span className="font-semibold">{row.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Charts</CardTitle>
          </CardHeader>
          <CardContent>
            <ReportsCharts
              leadsBySource={leadsBySource.map((row) => ({
                name: labelize(row.source),
                value: row.count,
              }))}
              leadStatus={leadStatus}
              salesByStage={stageCounts(salesStages, "SALES")}
              rentalsByStage={stageCounts(rentalStages, "RENTALS")}
              agentPerf={agentPerf}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent results</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {agentPerf.length === 0 ? (
            <p className="text-sm text-slate-500">No agents in scope</p>
          ) : (
            <table className="min-w-[32rem] w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 pr-3 font-medium">Agent</th>
                  <th className="py-2 pr-3 font-medium">Deals</th>
                  <th className="py-2 pr-3 font-medium">Closed</th>
                  <th className="py-2 font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {agentPerf.map((agent) => (
                  <tr key={agent.fullName} className="border-t">
                    <td className="py-2 pr-3">{agent.fullName}</td>
                    <td className="py-2 pr-3">{agent.deals}</td>
                    <td className="py-2 pr-3">{agent.closed}</td>
                    <td className="py-2">{formatCurrency(agent.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
