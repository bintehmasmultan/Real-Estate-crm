"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteProperty } from "@/app/actions/properties";
import { Button } from "@/components/ui/button";

export function PropertyDeleteButton({
  propertyId,
  title,
}: {
  propertyId: string;
  title: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="danger"
      disabled={pending}
      onClick={() => {
        if (
          !window.confirm(
            `Delete property "${title}"? This cannot be undone.`
          )
        ) {
          return;
        }
        startTransition(async () => {
          try {
            await deleteProperty(propertyId);
            toast.success("Property deleted");
            router.push("/properties");
            router.refresh();
          } catch {
            toast.error("Could not delete property");
          }
        });
      }}
    >
      {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}
