"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { markInboxMessageRead } from "@/app/actions/messages";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function InboxListItem({
  id,
  folder,
  subject,
  preview,
  peerLabel,
  when,
  unread,
  starred,
  active,
  isRecipient,
}: {
  id: string;
  folder: string;
  subject: string;
  preview: string;
  peerLabel: string;
  when: string;
  unread: boolean;
  starred: boolean;
  active: boolean;
  isRecipient: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          if (unread && isRecipient) {
            try {
              await markInboxMessageRead(id);
            } catch {
              // still open
            }
          }
          router.push(`/inbox?folder=${folder}&id=${id}`);
          router.refresh();
        });
      }}
      className={cn(
        "w-full border-t border-slate-100 px-4 py-3 text-left transition-colors dark:border-slate-800",
        active
          ? "bg-emerald-50 dark:bg-emerald-950/30"
          : "hover:bg-slate-50 dark:hover:bg-slate-900/60",
        unread ? "bg-white dark:bg-slate-950" : ""
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {starred ? (
              <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-500" />
            ) : null}
            <p
              className={cn(
                "truncate text-sm",
                unread ? "font-semibold text-slate-900 dark:text-slate-50" : "font-medium"
              )}
            >
              {subject}
            </p>
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-500">{peerLabel}</p>
          <p className="mt-1 line-clamp-2 text-xs text-slate-500">{preview}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-[11px] text-slate-400">{when}</span>
          {unread ? <Badge variant="warning">New</Badge> : null}
        </div>
      </div>
    </button>
  );
}
