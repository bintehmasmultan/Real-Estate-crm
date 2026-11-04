"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { markInboxMessageRead } from "@/app/actions/messages";
import { Button } from "@/components/ui/button";

export function MarkReadButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          try {
            await markInboxMessageRead(id);
            toast.success("Marked as read");
          } catch {
            toast.error("Could not update message");
          }
        });
      }}
    >
      {pending ? "Updating…" : "Mark as read"}
    </Button>
  );
}
