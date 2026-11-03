"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { convertLead } from "@/app/actions/leads";
import { Button } from "@/components/ui/button";

export function LeadActions({
  leadId,
  converted,
}: {
  leadId: string;
  converted: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (converted) {
    return <span className="text-xs text-slate-500">Converted</span>;
  }

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          try {
            await convertLead(leadId);
            toast.success("Lead converted to contact + deal");
          } catch {
            toast.error("Conversion failed");
          }
        });
      }}
    >
      {pending ? "Converting..." : "Convert"}
    </Button>
  );
}
