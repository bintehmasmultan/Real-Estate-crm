import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import {
  getContact,
  getProperty,
  getStage,
  getUsers,
  listActivities,
  listContactProperties,
  listDeals,
} from "@/lib/db/crm";
import { canDeleteRecords, canManageAssigned, getTeamAgentIds } from "@/lib/rbac";
import { formatCurrency, formatDateTime, fullName } from "@/lib/utils";
import { labelize } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactFormModal } from "@/components/contacts/contact-form-modal";
import { ContactDeleteButton } from "@/components/contacts/contact-delete-button";
import { ActivityForm } from "@/components/shared/activity-form";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSessionUser();
  if (!session) return null;

  const contact = await getContact(id);
  if (!contact) notFound();

  const agentIds = await getTeamAgentIds({
    id: session.id,
    role: session.role,
    teamId: session.teamId,
  });

  const [users, deals, cpRows, activities] = await Promise.all([
    getUsers(),
    listDeals(agentIds),
    listContactProperties(id),
    listActivities({ contactId: id }),
  ]);

  const userMap = new Map(users.map((u) => [u.id, u]));
  const agents = users.map((u) => ({ id: u.id, name: u.name }));
  const canManage = canManageAssigned(
    session,
    contact.assignedAgentId,
    agentIds
  );
  const canDelete = canDeleteRecords(session);
  const assignedAgent = contact.assignedAgentId
    ? userMap.get(contact.assignedAgentId)
    : null;

  const contactDeals = deals.filter((d) => d.contactId === id);
  const dealsWithStage = await Promise.all(
    contactDeals.map(async (d) => ({
      ...d,
      stage: d.stageId ? await getStage(d.stageId) : null,
      property: d.propertyId ? await getProperty(d.propertyId) : null,
    }))
  );

  const interestedIn = await Promise.all(
    cpRows.map(async (row) => ({
      ...row,
      property: await getProperty(row.propertyId),
    }))
  );

  const activityRows = activities.map((a) => ({
    ...a,
    createdBy: a.createdById ? userMap.get(a.createdById) : null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={fullName(contact.firstName, contact.lastName)}
        description={`${labelize(contact.type)} · ${contact.city || "No city"}`}
        actions={
          <>
            <Link href="/contacts" className="rounded-lg border px-3 py-2 text-sm">
              Back
            </Link>
            {canManage ? (
              <ContactFormModal agents={agents} contact={contact} triggerLabel="Edit" />
            ) : null}
            {canDelete ? (
              <ContactDeleteButton
                id={contact.id}
                name={fullName(contact.firstName, contact.lastName)}
                redirectTo="/contacts"
              />
            ) : null}
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge>{labelize(contact.status)}</Badge>
        {contact.source ? <Badge variant="info">{labelize(contact.source)}</Badge> : null}
        {(contact.tags ?? []).map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-slate-500">Email:</span> {contact.email || "—"}</p>
            <p><span className="text-slate-500">Phone:</span> {contact.phone || "—"}</p>
            <p><span className="text-slate-500">WhatsApp:</span> {contact.whatsapp || "—"}</p>
            <p><span className="text-slate-500">Address:</span> {contact.address || "—"}</p>
            <p><span className="text-slate-500">Agent:</span> {assignedAgent?.name || "—"}</p>
            <hr className="my-3 border-slate-100 dark:border-slate-800" />
            <p className="font-medium">Preferences</p>
            <p>Budget: {contact.budgetMin ? formatCurrency(contact.budgetMin) : "—"} – {contact.budgetMax ? formatCurrency(contact.budgetMax) : "—"}</p>
            <p>Location: {contact.preferredLocation || "—"}</p>
            <p>Type: {contact.preferredType ? labelize(contact.preferredType) : "—"}</p>
            <p>Beds/Baths: {contact.beds ?? "—"} / {contact.baths ?? "—"}</p>
            <p className="text-slate-500">{contact.preferenceNotes || contact.notes}</p>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Related deals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dealsWithStage.length === 0 ? (
                <p className="text-sm text-slate-500">No deals yet</p>
              ) : (
                dealsWithStage.map((d) => (
                  <Link
                    key={d.id}
                    href="/deals"
                    className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span>{d.title}</span>
                    <span className="text-slate-500">
                      {d.stage?.name ?? "—"} · {formatCurrency(d.value)}
                    </span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interested properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {interestedIn.length === 0 ? (
                <p className="text-sm text-slate-500">No linked properties</p>
              ) : (
                interestedIn.map((row) => (
                  <Link
                    key={row.id}
                    href={`/properties/${row.propertyId}`}
                    className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span>{row.property?.title ?? "Property"}</span>
                    <Badge variant="secondary">{row.interest || "interested"}</Badge>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ActivityForm contactId={contact.id} />
              <div className="space-y-3">
                {activityRows.map((a) => (
                  <div key={a.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{a.subject || labelize(a.type)}</p>
                      <Badge variant="info">{labelize(a.type)}</Badge>
                    </div>
                    {a.body ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{a.body}</p> : null}
                    <p className="mt-1 text-xs text-slate-500">
                      {a.createdBy?.name} · {formatDateTime(a.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
