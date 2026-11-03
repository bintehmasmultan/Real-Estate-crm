"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createDeal } from "@/app/actions/deals";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function DealFormModal({
  pipeline,
  stages,
  contacts,
  properties,
  agents,
}: {
  pipeline: string;
  stages: { id: string; name: string }[];
  contacts: { id: string; name: string }[];
  properties: { id: string; title: string }[];
  agents: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button onClick={() => setOpen(true)}>Add deal</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="New deal" className="max-w-xl">
        <form
          className="grid gap-3 sm:grid-cols-2"
          action={(fd) => {
            startTransition(async () => {
              try {
                await createDeal(fd);
                toast.success("Deal created");
                setOpen(false);
              } catch {
                toast.error("Failed to create deal");
              }
            });
          }}
        >
          <input type="hidden" name="pipeline" value={pipeline} />
          <div className="space-y-1 sm:col-span-2">
            <Label>Title</Label>
            <Input name="title" required />
          </div>
          <div className="space-y-1">
            <Label>Stage</Label>
            <Select name="stageId" required defaultValue={stages[0]?.id}>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Value</Label>
            <Input name="value" type="number" defaultValue={0} />
          </div>
          <div className="space-y-1">
            <Label>Probability %</Label>
            <Input name="probability" type="number" defaultValue={50} />
          </div>
          <div className="space-y-1">
            <Label>Expected close</Label>
            <Input name="expectedCloseDate" type="date" />
          </div>
          <div className="space-y-1">
            <Label>Contact</Label>
            <Select name="contactId">
              <option value="">None</option>
              {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Property</Label>
            <Select name="propertyId">
              <option value="">None</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </Select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Agent</Label>
            <Select name="agentId">
              <option value="">Me / default</option>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Notes</Label>
            <Textarea name="notes" />
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
