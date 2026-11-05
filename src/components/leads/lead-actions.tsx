"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { convertLead } from "@/app/actions/leads";
import { Button } from "@/components/ui/button";
import { AiAssistPanel } from "@/components/ai/ai-assist-panel";

export function LeadActions({
  leadId,
  converted,
}: {
  leadId: string;
  converted: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <AiAssistPanel leadId={leadId} triggerLabel="AI" triggerSize="sm" />
      {converted ? (
        <span className="text-xs text-slate-500">Converted</span>
      ) : (
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
      )}
    </div>
  );
}
