"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { sendMessage } from "@/app/actions/messages";
import { replySubject } from "@/lib/inbox";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Option = { id: string; name: string };

type ComposeDefaults = {
  toUserIds?: string[];
  subject?: string;
  body?: string;
  parentMessageId?: string;
  contactId?: string;
  propertyId?: string;
  dealId?: string;
  leadId?: string;
};

export function ComposeMessageModal({
  recipients,
  contacts = [],
  properties = [],
  deals = [],
  leads = [],
  triggerLabel = "Compose",
  triggerVariant = "default" as const,
  triggerSize = "default" as const,
  defaults,
  open: controlledOpen,
  onOpenChange,
}: {
  recipients: Option[];
  contacts?: Option[];
  properties?: Option[];
  deals?: Option[];
  leads?: Option[];
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost";
  triggerSize?: "default" | "sm" | "lg" | "icon";
  defaults?: ComposeDefaults;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>(defaults?.toUserIds || []);

  useEffect(() => {
    if (open) {
      setSelected(defaults?.toUserIds || []);
    }
  }, [open, defaults?.toUserIds]);

  const title = defaults?.parentMessageId ? "Reply" : "New message";
  const defaultSubject = useMemo(() => {
    if (!defaults?.subject) return "";
    return defaults.parentMessageId
      ? replySubject(defaults.subject)
      : defaults.subject;
  }, [defaults?.parentMessageId, defaults?.subject]);

  function toggleRecipient(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function selectAll() {
    setSelected(recipients.map((r) => r.id));
  }

  function clearAll() {
    setSelected([]);
  }

  return (
    <>
      {controlledOpen === undefined ? (
        <Button
          type="button"
          variant={triggerVariant}
          size={triggerSize}
          onClick={() => {
            setSelected(defaults?.toUserIds || []);
            setOpen(true);
          }}
        >
          {triggerLabel}
        </Button>
      ) : null}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        description="Send an internal team message"
        className="max-w-xl"
      >
        <form
          className="grid gap-3"
          action={(fd) => {
            selected.forEach((id) => fd.append("toUserIds", id));
            startTransition(async () => {
              try {
                const id = await sendMessage(fd);
                toast.success(
                  defaults?.parentMessageId ? "Reply sent" : "Message sent"
                );
                setOpen(false);
                router.push(`/inbox?folder=sent&id=${id}`);
                router.refresh();
              } catch (err) {
                toast.error(
                  err instanceof Error ? err.message : "Failed to send message"
                );
              }
            });
          }}
        >
          {defaults?.parentMessageId ? (
            <input
              type="hidden"
              name="parentMessageId"
              value={defaults.parentMessageId}
            />
          ) : null}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>To</Label>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  className="text-emerald-700 hover:underline dark:text-emerald-300"
                  onClick={selectAll}
                >
                  Select all
                </button>
                <button
                  type="button"
                  className="text-slate-500 hover:underline"
                  onClick={clearAll}
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-slate-800">
              {recipients.length === 0 ? (
                <p className="px-1 py-2 text-sm text-slate-500">
                  No teammates available.
                </p>
              ) : (
                recipients.map((r) => {
                  const checked = selected.includes(r.id);
                  return (
                    <label
                      key={r.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-900"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRecipient(r.id)}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                      />
                      <span>{r.name}</span>
                    </label>
                  );
                })
              )}
            </div>
            {selected.length > 0 ? (
              <p className="text-xs text-slate-500">
                {selected.length} recipient{selected.length === 1 ? "" : "s"}{" "}
                selected
              </p>
            ) : null}
          </div>

          <div className="space-y-1">
            <Label>Subject</Label>
            <Input
              name="subject"
              required
              placeholder="Subject"
              defaultValue={defaultSubject}
            />
          </div>

          <div className="space-y-1">
            <Label>Message</Label>
            <Textarea
              name="body"
              required
              rows={6}
              placeholder="Write your message…"
              defaultValue={defaults?.body || ""}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {contacts.length > 0 ? (
              <div className="space-y-1">
                <Label>Related contact</Label>
                <Select
                  name="contactId"
                  defaultValue={defaults?.contactId || ""}
                >
                  <option value="">None</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}
            {properties.length > 0 ? (
              <div className="space-y-1">
                <Label>Related listing</Label>
                <Select
                  name="propertyId"
                  defaultValue={defaults?.propertyId || ""}
                >
                  <option value="">None</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}
            {deals.length > 0 ? (
              <div className="space-y-1">
                <Label>Related deal</Label>
                <Select name="dealId" defaultValue={defaults?.dealId || ""}>
                  <option value="">None</option>
                  {deals.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}
            {leads.length > 0 ? (
              <div className="space-y-1">
                <Label>Related lead</Label>
                <Select name="leadId" defaultValue={defaults?.leadId || ""}>
                  <option value="">None</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending || recipients.length === 0 || selected.length === 0}
            >
              {pending ? "Sending…" : defaults?.parentMessageId ? "Send reply" : "Send"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
