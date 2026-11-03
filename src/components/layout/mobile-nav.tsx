"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Target,
  KanbanSquare,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/properties", label: "Listings", icon: Building2 },
  { href: "/leads", label: "Leads", icon: Target },
  { href: "/deals", label: "Deals", icon: KanbanSquare },
  { href: "/tasks", label: "More", icon: MoreHorizontal },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white px-2 py-2 dark:border-slate-800 dark:bg-slate-950 lg:hidden">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-lg py-1 text-[10px]",
              active ? "text-emerald-600" : "text-slate-500"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
