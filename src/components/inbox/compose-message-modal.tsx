"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { sendMessage } from "@/app/actions/messages";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Option = { id: string; name: string };

export function ComposeMessageModal({
  recipients,
}: {
  recipients: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button onClick={() => setOpen(true)}>Compose</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="New message">
        <form
          className="grid gap-3"
          action={(fd) => {
            startTransition(async () => {
              try {
                await sendMessage(fd);
                toast.success("Message sent");
                setOpen(false);
              } catch (err) {
                toast.error(
                  err instanceof Error ? err.message : "Failed to send message"
                );
              }
            });
          }}
        >
          <div className="space-y-1">
            <Label>To</Label>
            <Select name="toUserId" required defaultValue="">
              <option value="" disabled>
                Select teammate
              </option>
              {recipients.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Subject</Label>
            <Input name="subject" required placeholder="Subject" />
          </div>
          <div className="space-y-1">
            <Label>Message</Label>
            <Textarea name="body" required rows={5} placeholder="Write your message…" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || recipients.length === 0}>
              {pending ? "Sending…" : "Send"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
