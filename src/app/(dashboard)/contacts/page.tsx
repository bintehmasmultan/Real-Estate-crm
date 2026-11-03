import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeamAgentIds, agentScopeWhere } from "@/lib/rbac";
import { fullName, parseJsonArray } from "@/lib/utils";
import { labelize } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ContactFormModal } from "@/components/contacts/contact-form-modal";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; status?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const type = params.type || "";
  const status = params.status || "";
  const page = Math.max(1, Number(params.page || 1));
  const pageSize = 10;

  const agentIds = await getTeamAgentIds({
    id: session.user.id,
    role: session.user.role,
    teamId: session.user.teamId,
  });

  const where = {
    ...agentScopeWhere(agentIds),
    ...(type ? { type } : {}),
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { email: { contains: q } },
            { phone: { contains: q } },
            { city: { contains: q } },
          ],
        }
      : {}),
  };

  const [total, contacts, agents] = await Promise.all([
    prisma.contact.count({ where }),
    prisma.contact.findMany({
      where,
      include: { assignedAgent: true },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.findMany({
      where: { role: { in: ["AGENT", "MANAGER", "ADMIN"] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <PageHeader
        title="Contacts"
        description="Buyers, sellers, landlords, tenants, and investors"
        actions={<ContactFormModal agents={agents} />}
      />

      <form className="mb-4 grid gap-2 md:grid-cols-4">
        <Input name="q" placeholder="Search contacts..." defaultValue={q} />
        <Select name="type" defaultValue={type}>
          <option value="">All types</option>
          {["BUYER", "SELLER", "LANDLORD", "TENANT", "INVESTOR"].map((t) => (
            <option key={t} value={t}>
              {labelize(t)}
            </option>
          ))}
        </Select>
        <Select name="status" defaultValue={status}>
          <option value="">All statuses</option>
          {["ACTIVE", "INACTIVE", "LEAD", "CLIENT", "ARCHIVED"].map((t) => (
            <option key={t} value={t}>
              {labelize(t)}
            </option>
          ))}
        </Select>
        <button className="h-10 rounded-lg bg-slate-900 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900">
          Filter
        </button>
      </form>

      {contacts.length === 0 ? (
        <EmptyState title="No contacts found" description="Try adjusting filters or add a contact." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Tags</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3">
                    <Link href={`/contacts/${c.id}`} className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
                      {fullName(c.firstName, c.lastName)}
                    </Link>
                    <p className="text-xs text-slate-500">{c.email || c.phone}</p>
                  </td>
                  <td className="px-4 py-3">{labelize(c.type)}</td>
                  <td className="px-4 py-3">
                    <Badge>{labelize(c.status)}</Badge>
                  </td>
                  <td className="px-4 py-3">{c.city || "—"}</td>
                  <td className="px-4 py-3">{c.assignedAgent?.name || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {parseJsonArray(c.tags).slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
        <span>
          Page {page} of {totalPages} · {total} contacts
        </span>
        <div className="flex gap-2">
          {page > 1 ? (
            <Link
              className="rounded-lg border px-3 py-1.5"
              href={`/contacts?q=${q}&type=${type}&status=${status}&page=${page - 1}`}
            >
              Previous
            </Link>
          ) : null}
          {page < totalPages ? (
            <Link
              className="rounded-lg border px-3 py-1.5"
              href={`/contacts?q=${q}&type=${type}&status=${status}&page=${page + 1}`}
            >
              Next
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
