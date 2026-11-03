"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createTask } from "@/app/actions/tasks";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TASK_PRIORITIES, TASK_STATUSES, labelize } from "@/lib/constants";

export function TaskFormModal({ agents }: { agents: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button onClick={() => setOpen(true)}>Add task</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="New task">
        <form
          className="grid gap-3"
          action={(fd) => {
            startTransition(async () => {
              try {
                await createTask(fd);
                toast.success("Task created");
                setOpen(false);
              } catch {
                toast.error("Failed to create task");
              }
            });
          }}
        >
          <div className="space-y-1"><Label>Title</Label><Input name="title" required /></div>
          <div className="space-y-1"><Label>Description</Label><Textarea name="description" /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1"><Label>Due</Label><Input name="dueAt" type="datetime-local" /></div>
            <div className="space-y-1">
              <Label>Priority</Label>
              <Select name="priority" defaultValue="MEDIUM">
                {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{labelize(p)}</option>)}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select name="status" defaultValue="TODO">
                {TASK_STATUSES.map((s) => <option key={s} value={s}>{labelize(s)}</option>)}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Assignee</Label>
              <Select name="assigneeId">
                <option value="">Me</option>
                {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
