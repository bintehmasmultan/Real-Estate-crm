import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTime, fullName, parseJsonArray } from "@/lib/utils";
import { labelize } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactFormModal } from "@/components/contacts/contact-form-modal";
import { ActivityForm } from "@/components/shared/activity-form";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return null;

  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      assignedAgent: true,
      deals: { include: { stage: true, property: true } },
      interestedIn: { include: { property: true } },
      activities: {
        include: { createdBy: true },
        orderBy: { createdAt: "desc" },
      },
      notesList: { include: { author: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!contact) notFound();

  const agents = await prisma.user.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

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
            <ContactFormModal agents={agents} contact={contact} triggerLabel="Edit" />
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge>{labelize(contact.status)}</Badge>
        {contact.source ? <Badge variant="info">{labelize(contact.source)}</Badge> : null}
        {parseJsonArray(contact.tags).map((tag) => (
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
            <p><span className="text-slate-500">Agent:</span> {contact.assignedAgent?.name || "—"}</p>
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
              {contact.deals.length === 0 ? (
                <p className="text-sm text-slate-500">No deals yet</p>
              ) : (
                contact.deals.map((d) => (
                  <Link
                    key={d.id}
                    href="/deals"
                    className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span>{d.title}</span>
                    <span className="text-slate-500">
                      {d.stage.name} · {formatCurrency(d.value)}
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
              {contact.interestedIn.length === 0 ? (
                <p className="text-sm text-slate-500">No linked properties</p>
              ) : (
                contact.interestedIn.map((row) => (
                  <Link
                    key={row.id}
                    href={`/properties/${row.propertyId}`}
                    className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span>{row.property.title}</span>
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
                {contact.activities.map((a) => (
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
