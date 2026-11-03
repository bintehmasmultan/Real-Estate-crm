"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PROPERTY_TYPES, PROPERTY_STATUSES, labelize } from "@/lib/constants";
import { createProperty, updateProperty } from "@/app/actions/properties";
import { asStringArray } from "@/lib/utils";
import type { Property as PropertyRecord } from "@/lib/types";

type Option = { id: string; name: string };
type Property = PropertyRecord;

export function PropertyFormModal({
  agents,
  contacts,
  property,
  triggerLabel = "Add property",
}: {
  agents: Option[];
  contacts: Option[];
  property?: Property;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button onClick={() => setOpen(true)}>{triggerLabel}</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={property ? "Edit property" : "New property"}
        className="max-w-2xl"
      >
        <form
          className="grid gap-3 sm:grid-cols-2"
          action={(fd) => {
            startTransition(async () => {
              try {
                if (property) await updateProperty(property.id, fd);
                else await createProperty(fd);
                toast.success(property ? "Property updated" : "Property created");
                setOpen(false);
              } catch {
                toast.error("Failed to save property");
              }
            });
          }}
        >
          <div className="space-y-1 sm:col-span-2">
            <Label>Title</Label>
            <Input name="title" required defaultValue={property?.title} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Address</Label>
            <Input name="address" required defaultValue={property?.address} />
          </div>
          <div className="space-y-1">
            <Label>City</Label>
            <Input name="city" required defaultValue={property?.city} />
          </div>
          <div className="space-y-1">
            <Label>Price</Label>
            <Input name="price" type="number" required defaultValue={property?.price} />
          </div>
          <div className="space-y-1">
            <Label>Type</Label>
            <Select name="type" defaultValue={property?.type ?? "APARTMENT"}>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>{labelize(t)}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select name="status" defaultValue={property?.status ?? "AVAILABLE"}>
              {PROPERTY_STATUSES.map((t) => (
                <option key={t} value={t}>{labelize(t)}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Area</Label>
            <Input name="area" type="number" defaultValue={property?.area ?? ""} />
          </div>
          <div className="space-y-1">
            <Label>Area unit</Label>
            <Select name="areaUnit" defaultValue={property?.areaUnit ?? "sqft"}>
              <option value="sqft">Sq ft</option>
              <option value="marla">Marla</option>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Beds</Label>
            <Input name="beds" type="number" defaultValue={property?.beds ?? ""} />
          </div>
          <div className="space-y-1">
            <Label>Baths</Label>
            <Input name="baths" type="number" defaultValue={property?.baths ?? ""} />
          </div>
          <div className="space-y-1">
            <Label>Listing agent</Label>
            <Select name="listingAgentId" defaultValue={property?.listingAgentId ?? ""}>
              <option value="">Unassigned</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Owner contact</Label>
            <Select name="ownerContactId" defaultValue={property?.ownerContactId ?? ""}>
              <option value="">None</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Description</Label>
            <Textarea name="description" defaultValue={property?.description ?? ""} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Photo URLs (one per line)</Label>
            <Textarea
              name="photos"
              defaultValue={asStringArray(property?.photos).join("\n")}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Document URLs (one per line)</Label>
            <Textarea
              name="documents"
              defaultValue={asStringArray(property?.documents).join("\n")}
            />
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
