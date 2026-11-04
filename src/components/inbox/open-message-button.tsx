"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markInboxMessageRead } from "@/app/actions/messages";
import { Button } from "@/components/ui/button";

export function OpenMessageButton({
  id,
  folder,
  isRecipient,
  unread,
}: {
  id: string;
  folder: string;
  isRecipient: boolean;
  unread: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          if (unread && isRecipient) {
            try {
              await markInboxMessageRead(id);
            } catch {
              // still open the message
            }
          }
          router.push(`/inbox?folder=${folder}&id=${id}`);
          router.refresh();
        });
      }}
    >
      {pending ? "Opening…" : "Open"}
    </Button>
  );
}
