"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ButtonSize = "default" | "sm" | "lg" | "icon";

export function DeleteRecordButton({
  label = "Delete",
  confirmLabel,
  successMessage = "Deleted",
  errorMessage = "Could not delete",
  redirectTo,
  size = "sm",
  onDelete,
}: {
  label?: string;
  confirmLabel: string;
  successMessage?: string;
  errorMessage?: string;
  redirectTo?: string;
  size?: ButtonSize;
  onDelete: () => Promise<void>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="danger"
      size={size}
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm(`${confirmLabel} This cannot be undone.`)) return;
        startTransition(async () => {
          try {
            await onDelete();
            toast.success(successMessage);
            if (redirectTo) router.push(redirectTo);
            router.refresh();
          } catch {
            toast.error(errorMessage);
          }
        });
      }}
    >
      {pending ? "Deleting…" : label}
    </Button>
  );
}
