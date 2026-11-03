import Link from "next/link";
import { getSessionUser } from "@/lib/firebase/session";
import { getUsers, listContacts, listProperties } from "@/lib/db/crm";
import { getTeamAgentIds } from "@/lib/rbac";
import { formatCurrency, fullName } from "@/lib/utils";
import { labelize } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PropertyFormModal } from "@/components/properties/property-form-modal";

function propertyMatches(
  p: {
    title: string;
    address: string;
    city: string;
    type: string;
    status: string;
  },
  q: string,
  status: string,
  type: string
) {
  if (status && p.status !== status) return false;
  if (type && p.type !== type) return false;
  if (!q) return true;
  const hay = [p.title, p.address, p.city].join(" ").toLowerCase();
  return hay.includes(q.toLowerCase());
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; type?: string }>;
}) {
  const session = await getSessionUser();
  if (!session) return null;
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const status = params.status || "";
  const type = params.type || "";

  const agentIds = await getTeamAgentIds({
    id: session.id,
    role: session.role,
    teamId: session.teamId,
  });

  const [allProperties, users, contacts] = await Promise.all([
    listProperties(agentIds),
    getUsers(),
    listContacts(agentIds),
  ]);

  const properties = allProperties.filter((p) =>
    propertyMatches(p, q, status, type)
  );

  const userMap = new Map(users.map((u) => [u.id, u]));
  const agents = users.map((u) => ({ id: u.id, name: u.name }));

  return (
    <div>
      <PageHeader
        title="Properties"
        description="Listings across sales and rentals"
        actions={
          <PropertyFormModal
            agents={agents}
            contacts={contacts.map((c) => ({
              id: c.id,
              name: fullName(c.firstName, c.lastName),
            }))}
          />
        }
      />

      <form className="mb-4 grid gap-2 md:grid-cols-4">
        <Input name="q" placeholder="Search listings..." defaultValue={q} />
        <Select name="type" defaultValue={type}>
          <option value="">All types</option>
          {["APARTMENT", "HOUSE", "PLOT", "COMMERCIAL"].map((t) => (
            <option key={t} value={t}>{labelize(t)}</option>
          ))}
        </Select>
        <Select name="status" defaultValue={status}>
          <option value="">All statuses</option>
          {["AVAILABLE", "UNDER_OFFER", "SOLD", "RENTED", "OFF_MARKET"].map((t) => (
            <option key={t} value={t}>{labelize(t)}</option>
          ))}
        </Select>
        <button className="h-10 rounded-lg bg-slate-900 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900">
          Filter
        </button>
      </form>

      {properties.length === 0 ? (
        <EmptyState title="No properties found" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {properties.map((p) => (
            <Link
              key={p.id}
              href={`/properties/${p.id}`}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className="font-medium leading-snug">{p.title}</h3>
                <Badge variant={p.status === "AVAILABLE" ? "default" : "secondary"}>
                  {labelize(p.status)}
                </Badge>
              </div>
              <p className="text-sm text-slate-500">{p.address}, {p.city}</p>
              <p className="mt-2 text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                {formatCurrency(p.price)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {labelize(p.type)}
                {p.area ? ` · ${p.area} ${p.areaUnit}` : ""}
                {p.beds ? ` · ${p.beds} beds` : ""}
                {" · "}
                {p.listingAgentId
                  ? userMap.get(p.listingAgentId)?.name || "Unassigned"
                  : "Unassigned"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
