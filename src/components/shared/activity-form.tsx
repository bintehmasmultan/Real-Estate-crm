"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { createActivity } from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ACTIVITY_TYPES, labelize } from "@/lib/constants";

export function ActivityForm({
  contactId,
  propertyId,
  dealId,
  leadId,
}: {
  contactId?: string;
  propertyId?: string;
  dealId?: string;
  leadId?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-2 rounded-lg border border-dashed p-3 sm:grid-cols-2"
      action={(fd) => {
        startTransition(async () => {
          try {
            await createActivity(fd);
            toast.success("Activity logged");
          } catch {
            toast.error("Failed to log activity");
          }
        });
      }}
    >
      {contactId ? <input type="hidden" name="contactId" value={contactId} /> : null}
      {propertyId ? <input type="hidden" name="propertyId" value={propertyId} /> : null}
      {dealId ? <input type="hidden" name="dealId" value={dealId} /> : null}
      {leadId ? <input type="hidden" name="leadId" value={leadId} /> : null}
      <Select name="type" defaultValue="NOTE">
        {ACTIVITY_TYPES.map((t) => (
          <option key={t} value={t}>
            {labelize(t)}
          </option>
        ))}
      </Select>
      <Input name="subject" placeholder="Subject" />
      <Textarea name="body" placeholder="Notes..." className="sm:col-span-2" />
      <Input name="scheduledAt" type="datetime-local" className="sm:col-span-2" />
      <Button type="submit" disabled={pending} className="sm:col-span-2">
        {pending ? "Saving..." : "Log activity"}
      </Button>
    </form>
  );
}
