"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Target,
  KanbanSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/contacts", label: "People", icon: Users },
  { href: "/properties", label: "Listings", icon: Building2 },
  { href: "/leads", label: "Leads", icon: Target },
  { href: "/deals", label: "Deals", icon: KanbanSquare },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/90 px-2 pt-1 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 lg:hidden pb-[max(0.4rem,env(safe-area-inset-bottom))]">
      <ul className="flex">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium",
                  active ? "text-emerald-600" : "text-slate-500"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
