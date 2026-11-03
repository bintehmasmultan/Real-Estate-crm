import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, fullName, parseJsonArray } from "@/lib/utils";
import { labelize } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyFormModal } from "@/components/properties/property-form-modal";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await auth();

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      listingAgent: true,
      ownerContact: true,
      deals: { include: { stage: true, contact: true } },
      interestedContacts: { include: { contact: true } },
    },
  });
  if (!property) notFound();

  const [agents, contacts] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.contact.findMany({
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
  ]);

  const photos = parseJsonArray(property.photos);
  const documents = parseJsonArray(property.documents);

  return (
    <div className="space-y-6">
      <PageHeader
        title={property.title}
        description={`${property.address}, ${property.city}`}
        actions={
          <>
            <Link href="/properties" className="rounded-lg border px-3 py-2 text-sm">Back</Link>
            <PropertyFormModal
              agents={agents}
              contacts={contacts.map((c) => ({
                id: c.id,
                name: fullName(c.firstName, c.lastName),
              }))}
              property={property}
              triggerLabel="Edit"
            />
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
            <p>Agent: {property.listingAgent?.name || "—"}</p>
            <p>
              Owner:{" "}
              {property.ownerContact
                ? fullName(property.ownerContact.firstName, property.ownerContact.lastName)
                : "—"}
            </p>
            <p className="text-slate-500">{property.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Interested contacts</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {property.interestedContacts.map((row) => (
              <Link
                key={row.id}
                href={`/contacts/${row.contactId}`}
                className="block rounded-lg border p-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {fullName(row.contact.firstName, row.contact.lastName)}
                <span className="ml-2 text-slate-500">{row.interest}</span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Related deals & docs</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {property.deals.map((d) => (
              <div key={d.id} className="rounded-lg border p-3">
                <p className="font-medium">{d.title}</p>
                <p className="text-slate-500">{d.stage.name} · {formatCurrency(d.value)}</p>
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
