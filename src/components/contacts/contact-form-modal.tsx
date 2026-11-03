"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CONTACT_TYPES,
  CONTACT_STATUSES,
  LEAD_SOURCES,
  PROPERTY_TYPES,
  labelize,
} from "@/lib/constants";
import { createContact, updateContact } from "@/app/actions/contacts";
import { asStringArray } from "@/lib/utils";
import type { Contact as ContactRecord } from "@/lib/types";

type Agent = { id: string; name: string };
type Contact = ContactRecord;

export function ContactFormModal({
  agents,
  contact,
  triggerLabel = "Add contact",
}: {
  agents: Agent[];
  contact?: Contact;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        if (contact) await updateContact(contact.id, formData);
        else await createContact(formData);
        toast.success(contact ? "Contact updated" : "Contact created");
        setOpen(false);
      } catch {
        toast.error("Something went wrong");
      }
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>{triggerLabel}</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={contact ? "Edit contact" : "New contact"}
        description="Clients, buyers, sellers, and investors"
        className="max-w-2xl"
      >
        <form action={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>First name</Label>
            <Input name="firstName" required defaultValue={contact?.firstName} />
          </div>
          <div className="space-y-1">
            <Label>Last name</Label>
            <Input name="lastName" required defaultValue={contact?.lastName} />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input name="email" type="email" defaultValue={contact?.email ?? ""} />
          </div>
          <div className="space-y-1">
            <Label>Phone</Label>
            <Input name="phone" defaultValue={contact?.phone ?? ""} />
          </div>
          <div className="space-y-1">
            <Label>WhatsApp</Label>
            <Input name="whatsapp" defaultValue={contact?.whatsapp ?? ""} />
          </div>
          <div className="space-y-1">
            <Label>City</Label>
            <Input name="city" defaultValue={contact?.city ?? ""} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Address</Label>
            <Input name="address" defaultValue={contact?.address ?? ""} />
          </div>
          <div className="space-y-1">
            <Label>Type</Label>
            <Select name="type" defaultValue={contact?.type ?? "BUYER"}>
              {CONTACT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {labelize(t)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select name="status" defaultValue={contact?.status ?? "ACTIVE"}>
              {CONTACT_STATUSES.map((t) => (
                <option key={t} value={t}>
                  {labelize(t)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Source</Label>
            <Select name="source" defaultValue={contact?.source ?? "WEBSITE"}>
              {LEAD_SOURCES.map((t) => (
                <option key={t} value={t}>
                  {labelize(t)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Assigned agent</Label>
            <Select
              name="assignedAgentId"
              defaultValue={contact?.assignedAgentId ?? ""}
            >
              <option value="">Unassigned</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Budget min</Label>
            <Input
              name="budgetMin"
              type="number"
              defaultValue={contact?.budgetMin ?? ""}
            />
          </div>
          <div className="space-y-1">
            <Label>Budget max</Label>
            <Input
              name="budgetMax"
              type="number"
              defaultValue={contact?.budgetMax ?? ""}
            />
          </div>
          <div className="space-y-1">
            <Label>Preferred location</Label>
            <Input
              name="preferredLocation"
              defaultValue={contact?.preferredLocation ?? ""}
            />
          </div>
          <div className="space-y-1">
            <Label>Preferred type</Label>
            <Select
              name="preferredType"
              defaultValue={contact?.preferredType ?? ""}
            >
              <option value="">Any</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {labelize(t)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Beds</Label>
            <Input name="beds" type="number" defaultValue={contact?.beds ?? ""} />
          </div>
          <div className="space-y-1">
            <Label>Baths</Label>
            <Input name="baths" type="number" defaultValue={contact?.baths ?? ""} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Tags (comma separated)</Label>
            <Input
              name="tags"
              defaultValue={asStringArray(contact?.tags).join(", ")}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Notes</Label>
            <Textarea name="notes" defaultValue={contact?.notes ?? ""} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Preference notes</Label>
            <Textarea
              name="preferenceNotes"
              defaultValue={contact?.preferenceNotes ?? ""}
            />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
