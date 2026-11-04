"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { emptyInboxTrash } from "@/app/actions/messages";
import { Button } from "@/components/ui/button";

export function EmptyTrashButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Empty trash? Messages deleted by everyone will be removed permanently.")) {
          return;
        }
        startTransition(async () => {
          try {
            await emptyInboxTrash();
            toast.success("Trash emptied");
            router.push("/inbox?folder=trash");
            router.refresh();
          } catch {
            toast.error("Could not empty trash");
          }
        });
      }}
    >
      {pending ? "Emptying…" : "Empty trash"}
    </Button>
  );
}
