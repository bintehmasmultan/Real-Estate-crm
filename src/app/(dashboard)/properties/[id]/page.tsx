import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import {
  getContact,
  getProperty,
  getStage,
  getUsers,
  listContactProperties,
  listContacts,
  listDeals,
} from "@/lib/db/crm";
import { canManageProperty, getTeamAgentIds } from "@/lib/rbac";
import { formatCurrency, fullName } from "@/lib/utils";
import { labelize } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyFormModal } from "@/components/properties/property-form-modal";
import { PropertyDeleteButton } from "@/components/properties/property-delete-button";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSessionUser();
  if (!session) return null;

  const property = await getProperty(id);
  if (!property) notFound();

  const agentIds = await getTeamAgentIds({
    id: session.id,
    role: session.role,
    teamId: session.teamId,
  });

  const [users, contacts, deals, cpRows] = await Promise.all([
    getUsers(),
    listContacts(agentIds),
    listDeals(agentIds),
    listContactProperties(undefined, id),
  ]);

  const userMap = new Map(users.map((u) => [u.id, u]));
  const canManage = canManageProperty(
    session,
    property.listingAgentId,
    agentIds
  );
  const canAssignAgent = session.role === "ADMIN";
  const agents =
    session.role === "ADMIN"
      ? users.map((u) => ({ id: u.id, name: u.name }))
      : users
          .filter((u) => agentIds === null || agentIds.includes(u.id))
          .map((u) => ({ id: u.id, name: u.name }));
  const listingAgent = property.listingAgentId
    ? userMap.get(property.listingAgentId)
    : null;
  const ownerContact = property.ownerContactId
    ? await getContact(property.ownerContactId)
    : null;

  const propertyDeals = deals.filter((d) => d.propertyId === id);
  const dealsWithRelations = await Promise.all(
    propertyDeals.map(async (d) => ({
      ...d,
      stage: d.stageId ? await getStage(d.stageId) : null,
      contact: d.contactId ? await getContact(d.contactId) : null,
    }))
  );

  const interestedContacts = await Promise.all(
    cpRows.map(async (row) => ({
      ...row,
      contact: await getContact(row.contactId),
    }))
  );

  const photos = property.photos ?? [];
  const documents = property.documents ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={property.title}
        description={`${property.address}, ${property.city}`}
        actions={
          <>
            <Link href="/properties" className="rounded-lg border px-3 py-2 text-sm">Back</Link>
            {canManage ? (
              <>
                <PropertyFormModal
                  agents={agents}
                  contacts={contacts.map((c) => ({
                    id: c.id,
                    name: fullName(c.firstName, c.lastName),
                  }))}
                  property={property}
                  triggerLabel="Edit"
                  canAssignAgent={canAssignAgent}
                  defaultAgentId={session.id}
                />
                <PropertyDeleteButton
                  propertyId={property.id}
                  title={property.title}
                />
              </>
            ) : null}
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge>{labelize(property.status)}</Badge>
        <Badge variant="info">{labelize(property.type)}</Badge>
        <Badge variant="secondary">{formatCurrency(property.price)}</Badge>
      </div>

      {photos[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photos[0]}
          alt={property.title}
          className="h-64 w-full rounded-2xl object-cover"
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Area: {property.area ? `${property.area} ${property.areaUnit}` : "—"}</p>
            <p>Beds / Baths: {property.beds ?? "—"} / {property.baths ?? "—"}</p>
            <p>Agent: {listingAgent?.name || "—"}</p>
            <p>
              Owner:{" "}
              {ownerContact
                ? fullName(ownerContact.firstName, ownerContact.lastName)
                : "—"}
            </p>
            <p className="text-slate-500">{property.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Interested contacts</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {interestedContacts.map((row) => (
              <Link
                key={row.id}
                href={`/contacts/${row.contactId}`}
                className="block rounded-lg border p-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {row.contact
                  ? fullName(row.contact.firstName, row.contact.lastName)
                  : "Contact"}
                <span className="ml-2 text-slate-500">{row.interest}</span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Related deals & docs</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {dealsWithRelations.map((d) => (
              <div key={d.id} className="rounded-lg border p-3">
                <p className="font-medium">{d.title}</p>
                <p className="text-slate-500">{d.stage?.name ?? "—"} · {formatCurrency(d.value)}</p>
              </div>
            ))}
            {documents.map((doc) => (
              <a key={doc} href={doc} target="_blank" rel="noreferrer" className="block text-emerald-600 hover:underline">
                {doc}
              </a>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
