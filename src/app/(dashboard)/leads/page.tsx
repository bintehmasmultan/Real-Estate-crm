import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeamAgentIds, agentScopeWhere } from "@/lib/rbac";
import { formatCurrency, fullName } from "@/lib/utils";
import { labelize } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LeadActions } from "@/components/leads/lead-actions";
import { LeadFormModal } from "@/components/leads/lead-form-modal";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; source?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const status = params.status || "";
  const source = params.source || "";

  const agentIds = await getTeamAgentIds({
    id: session.user.id,
    role: session.user.role,
    teamId: session.user.teamId,
  });

  const where = {
    ...agentScopeWhere(agentIds),
    ...(status ? { status } : {}),
    ...(source ? { source } : {}),
    ...(q
      ? {
          OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { email: { contains: q } },
            { phone: { contains: q } },
          ],
        }
      : {}),
  };

  const [leads, agents] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: { assignedAgent: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: { in: ["AGENT", "MANAGER", "ADMIN"] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Inbound inquiries and scoring"
        actions={<LeadFormModal agents={agents} />}
      />

      <form className="mb-4 grid gap-2 md:grid-cols-4">
        <Input name="q" placeholder="Search leads..." defaultValue={q} />
        <Select name="status" defaultValue={status}>
          <option value="">All statuses</option>
          {["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED", "LOST"].map((s) => (
            <option key={s} value={s}>{labelize(s)}</option>
          ))}
        </Select>
        <Select name="source" defaultValue={source}>
          <option value="">All sources</option>
          {["WEBSITE", "FACEBOOK", "REFERRAL", "WALK_IN", "ZAMEEN", "OLX", "OTHER"].map((s) => (
            <option key={s} value={s}>{labelize(s)}</option>
          ))}
        </Select>
        <button className="h-10 rounded-lg bg-slate-900 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900">
          Filter
        </button>
      </form>

      {leads.length === 0 ? (
        <EmptyState title="No leads found" description="Share /lead for public capture." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-950">
              <tr>
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3">
                    <p className="font-medium">{fullName(lead.firstName, lead.lastName)}</p>
                    <p className="text-xs text-slate-500">{lead.email || lead.phone}</p>
                  </td>
                  <td className="px-4 py-3">{labelize(lead.source)}</td>
                  <td className="px-4 py-3"><Badge>{labelize(lead.status)}</Badge></td>
                  <td className="px-4 py-3">{lead.score}</td>
                  <td className="px-4 py-3">{lead.budget ? formatCurrency(lead.budget) : "—"}</td>
                  <td className="px-4 py-3">{lead.assignedAgent?.name || "—"}</td>
                  <td className="px-4 py-3">
                    <LeadActions leadId={lead.id} converted={lead.status === "CONVERTED"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
