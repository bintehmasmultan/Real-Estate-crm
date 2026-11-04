"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, Sparkles } from "lucide-react";
import { createActivity } from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

type ActionKey = "draft" | "summarize" | "match";

type AiAssistPanelProps = {
  contactId?: string;
  dealId?: string;
  leadId?: string;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost";
  triggerSize?: "default" | "sm" | "lg" | "icon";
  className?: string;
};

async function callAi(
  action: ActionKey,
  ids: { contactId?: string; dealId?: string; leadId?: string }
) {
  const path =
    action === "draft"
      ? "/api/ai/draft"
      : action === "summarize"
        ? "/api/ai/summarize"
        : "/api/ai/match-properties";

  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...ids,
      channel: "whatsapp",
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    text?: string;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error || "AI request failed");
  }
  return data.text || "";
}

export function AiAssistPanel({
  contactId,
  dealId,
  leadId,
  triggerLabel = "AI Assist",
  triggerVariant = "outline",
  triggerSize = "sm",
  className,
}: AiAssistPanelProps) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState("");
  const [active, setActive] = useState<ActionKey | null>(null);
  const [pending, startTransition] = useTransition();

  const canMatch = Boolean(contactId || leadId);
  const canSaveNote = Boolean(contactId || dealId || leadId);

  function run(action: ActionKey) {
    startTransition(async () => {
      setActive(action);
      try {
        const text = await callAi(action, { contactId, dealId, leadId });
        setResult(text);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "AI request failed");
      } finally {
        setActive(null);
      }
    });
  }

  async function copyText() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      toast.success("Copied");
    } catch {
      toast.error("Could not copy");
    }
  }

  function saveAsNote() {
    if (!result || !canSaveNote) return;
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("type", "NOTE");
        fd.set("subject", "AI Assist note");
        fd.set("body", result);
        if (contactId) fd.set("contactId", contactId);
        if (dealId) fd.set("dealId", dealId);
        if (leadId) fd.set("leadId", leadId);
        await createActivity(fd);
        toast.success("Saved to activity");
      } catch {
        toast.error("Could not save note");
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant={triggerVariant}
        size={triggerSize}
        className={className}
        onClick={() => setOpen(true)}
      >
        <Sparkles className="h-3.5 w-3.5" />
        {triggerLabel}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="AI Assist"
        description="Draft outreach, summarize the record, or suggest listing matches."
        className="max-w-xl"
      >
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={() => run("draft")}
          >
            {active === "draft" ? "Drafting…" : "Draft message"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => run("summarize")}
          >
            {active === "summarize" ? "Summarizing…" : "Summarize"}
          </Button>
          {canMatch ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => run("match")}
            >
              {active === "match" ? "Matching…" : "Suggest listings"}
            </Button>
          ) : null}
        </div>

        <div className="mt-4 min-h-40 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm whitespace-pre-wrap dark:border-slate-800 dark:bg-slate-950">
          {result || (
            <span className="text-slate-500">
              Choose an action to generate a response.
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!result}
            onClick={copyText}
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </Button>
          {canSaveNote ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={!result || pending}
              onClick={saveAsNote}
            >
              Insert into activity note
            </Button>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
