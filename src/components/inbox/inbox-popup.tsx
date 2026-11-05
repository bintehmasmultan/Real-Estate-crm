"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Inbox, Maximize2, X } from "lucide-react";
import { markInboxMessageRead } from "@/app/actions/messages";
import { cn } from "@/lib/utils";

export type InboxPopupItem = {
  id: string;
  subject: string;
  preview: string;
  fromName: string;
  when: string;
  unread: boolean;
};

export function InboxPopup({
  unreadCount,
  items,
}: {
  unreadCount: number;
  items: InboxPopupItem[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);

  const hiddenOnInbox = pathname.startsWith("/inbox");

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointer(e: MouseEvent) {
      if (!panelRef.current) return;
      if (panelRef.current.contains(e.target as Node)) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-inbox-popup-trigger]")) return;
      setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  if (hiddenOnInbox) return null;

  function openMessage(item: InboxPopupItem) {
    startTransition(async () => {
      if (item.unread) {
        try {
          await markInboxMessageRead(item.id);
        } catch {
          // still navigate
        }
      }
      setOpen(false);
      router.push(`/inbox?folder=inbox&id=${item.id}`);
      router.refresh();
    });
  }

  return (
    <div className="pointer-events-none fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-3 z-40 flex flex-col items-end gap-3 lg:bottom-6 lg:right-6">
      {open ? (
        <div
          ref={panelRef}
          className="pointer-events-auto flex w-[min(100vw-1.5rem,22rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-emerald-600 px-4 py-3 text-white dark:border-slate-800">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Inbox</p>
              <p className="text-xs text-emerald-50/90">
                {unreadCount > 0
                  ? `${unreadCount} unread message${unreadCount === 1 ? "" : "s"}`
                  : "You're all caught up"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/inbox"
                className="rounded-lg p-2 hover:bg-white/15"
                title="Open full inbox"
                onClick={() => setOpen(false)}
              >
                <Maximize2 className="h-4 w-4" />
              </Link>
              <button
                type="button"
                className="rounded-lg p-2 hover:bg-white/15"
                aria-label="Close inbox panel"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                No recent messages.
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={pending}
                  onClick={() => openMessage(item)}
                  className={cn(
                    "w-full border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-slate-50 dark:border-slate-900 dark:hover:bg-slate-900",
                    item.unread ? "bg-emerald-50/40 dark:bg-emerald-950/20" : ""
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={cn(
                        "truncate text-sm",
                        item.unread ? "font-semibold" : "font-medium"
                      )}
                    >
                      {item.subject}
                    </p>
                    {item.unread ? (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {item.fromName} · {item.when}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                    {item.preview}
                  </p>
                </button>
              ))
            )}
          </div>

          <div className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
            <Link
              href="/inbox"
              onClick={() => setOpen(false)}
              className="inline-flex h-8 flex-1 items-center justify-center rounded-md border border-slate-200 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
            >
              View all
            </Link>
            <Link
              href="/inbox"
              onClick={() => setOpen(false)}
              className="inline-flex h-8 flex-1 items-center justify-center rounded-md bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Open inbox
            </Link>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        data-inbox-popup-trigger
        aria-label={open ? "Close inbox panel" : "Open inbox panel"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
      >
        {open ? <X className="h-5 w-5" /> : <Inbox className="h-5 w-5" />}
        {!open && unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-slate-900">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>
    </div>
  );
}
