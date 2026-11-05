import { getSessionUser } from "@/lib/firebase/session";
import { getUsers, listLeads } from "@/lib/db/crm";
import { canDeleteRecords, getTeamAgentIds } from "@/lib/rbac";
import { formatCurrency, fullName } from "@/lib/utils";
import { labelize } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LeadActions } from "@/components/leads/lead-actions";
import { LeadDeleteButton } from "@/components/leads/lead-delete-button";
import { LeadFormModal } from "@/components/leads/lead-form-modal";

function leadMatches(
  l: {
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    status: string;
    source: string;
  },
  q: string,
  status: string,
  source: string
) {
  if (status && l.status !== status) return false;
  if (source && l.source !== source) return false;
  if (!q) return true;
  const hay = [l.firstName, l.lastName, l.email, l.phone]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q.toLowerCase());
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; source?: string }>;
}) {
  const session = await getSessionUser();
  if (!session) return null;
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const status = params.status || "";
  const source = params.source || "";

  const agentIds = await getTeamAgentIds({
    id: session.id,
    role: session.role,
    teamId: session.teamId,
  });

  const [allLeads, users] = await Promise.all([
    listLeads(agentIds),
    getUsers(),
  ]);

  const leads = allLeads.filter((l) => leadMatches(l, q, status, source));
  const userMap = new Map(users.map((u) => [u.id, u]));
  const agents = users
    .filter((u) => u.role === "AGENT" || u.role === "MANAGER" || u.role === "ADMIN")
    .map((u) => ({ id: u.id, name: u.name }));

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Inbound inquiries and scoring"
        actions={<LeadFormModal agents={agents} />}
      />

      <form className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
        <>
        <ul className="grid gap-3 md:hidden">
          {leads.map((lead) => (
            <li
              key={lead.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{fullName(lead.firstName, lead.lastName)}</p>
                  <p className="truncate text-xs text-slate-500">{lead.email || lead.phone || "No contact details"}</p>
                </div>
                <Badge>{labelize(lead.status)}</Badge>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {labelize(lead.source)} · score {lead.score}
                {lead.budget ? ` · ${formatCurrency(lead.budget)}` : ""}
              </p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="truncate text-xs text-slate-500">
                  {lead.assignedAgentId
                    ? userMap.get(lead.assignedAgentId)?.name || "Unassigned"
                    : "Unassigned"}
                </p>
                <LeadActions leadId={lead.id} converted={lead.status === "CONVERTED"} />
              </div>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:block">
          <table className="min-w-[840px] w-full text-sm">
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
                  <td className="px-4 py-3">
                    {lead.assignedAgentId
                      ? userMap.get(lead.assignedAgentId)?.name || "—"
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <LeadActions leadId={lead.id} converted={lead.status === "CONVERTED"} />
                      {canDeleteRecords(session) ? (
                        <LeadDeleteButton
                          id={lead.id}
                          name={fullName(lead.firstName, lead.lastName)}
                        />
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
