"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createLead } from "@/app/actions/leads";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LEAD_SOURCES, LEAD_STATUSES, PROPERTY_TYPES, labelize } from "@/lib/constants";

export function LeadFormModal({ agents }: { agents: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button onClick={() => setOpen(true)}>Add lead</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="New lead" className="max-w-xl">
        <form
          className="grid gap-3 sm:grid-cols-2"
          action={(fd) => {
            startTransition(async () => {
              try {
                await createLead(fd);
                toast.success("Lead created");
                setOpen(false);
              } catch {
                toast.error("Failed to create lead");
              }
            });
          }}
        >
          <div className="space-y-1"><Label>First name</Label><Input name="firstName" required /></div>
          <div className="space-y-1"><Label>Last name</Label><Input name="lastName" required /></div>
          <div className="space-y-1"><Label>Email</Label><Input name="email" type="email" /></div>
          <div className="space-y-1"><Label>Phone</Label><Input name="phone" /></div>
          <div className="space-y-1">
            <Label>Source</Label>
            <Select name="source" defaultValue="WEBSITE">
              {LEAD_SOURCES.map((s) => <option key={s} value={s}>{labelize(s)}</option>)}
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select name="status" defaultValue="NEW">
              {LEAD_STATUSES.map((s) => <option key={s} value={s}>{labelize(s)}</option>)}
            </Select>
          </div>
          <div className="space-y-1"><Label>Score</Label><Input name="score" type="number" defaultValue={50} /></div>
          <div className="space-y-1"><Label>Budget</Label><Input name="budget" type="number" /></div>
          <div className="space-y-1">
            <Label>Preferred type</Label>
            <Select name="preferredType">
              <option value="">Any</option>
              {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{labelize(t)}</option>)}
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Agent</Label>
            <Select name="assignedAgentId">
              <option value="">Auto / me</option>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </div>
          <div className="space-y-1 sm:col-span-2"><Label>Location</Label><Input name="preferredLocation" /></div>
          <div className="space-y-1 sm:col-span-2"><Label>Message</Label><Textarea name="message" /></div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
