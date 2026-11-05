"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  KanbanSquare,
  Inbox,
  MoreHorizontal,
  Target,
  CheckSquare,
  CalendarDays,
  BarChart3,
  UserRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const primaryItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/contacts", label: "People", icon: Users },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/properties", label: "Listings", icon: Building2 },
  { href: "/deals", label: "Deals", icon: KanbanSquare },
];

const moreItems = [
  { href: "/leads", label: "Leads", icon: Target },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings/profile", label: "Profile", icon: UserRound },
];

export function MobileNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const moreActive = moreItems.some((item) => pathname.startsWith(item.href));

  return (
    <>
      {moreOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close more menu"
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-slate-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-xl dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">More</p>
              <button
                type="button"
                aria-label="Close more menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
                onClick={() => setMoreOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex min-h-12 items-center gap-2 rounded-xl border px-3 py-3 text-sm",
                      active
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-200"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200/80 bg-white/90 px-1 pt-1 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 lg:hidden pb-[max(0.4rem,env(safe-area-inset-bottom))]">
        {primaryItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const showBadge = item.href === "/inbox" && unreadCount > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-medium",
                active ? "text-emerald-600" : "text-slate-500"
              )}
            >
              <span className="relative">
                <Icon className="h-4 w-4" />
                {showBadge ? (
                  <span className="absolute -right-2 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-emerald-600 px-0.5 text-[8px] font-semibold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </span>
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={cn(
            "flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-medium",
            moreActive || moreOpen ? "text-emerald-600" : "text-slate-500"
          )}
        >
          <MoreHorizontal className="h-4 w-4" />
          More
        </button>
      </nav>
    </>
  );
}
