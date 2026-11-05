"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Target,
  KanbanSquare,
  CheckSquare,
  CalendarDays,
  BarChart3,
  ShieldCheck,
  UsersRound,
  UserRound,
  Building,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";

const workspace = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/properties", label: "Properties", icon: Building2 },
  { href: "/leads", label: "Leads", icon: Target },
  { href: "/deals", label: "Deals", icon: KanbanSquare },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings/profile", label: "My profile", icon: UserRound },
];

const adminNav = [
  { href: "/admin/users", label: "People & teams", icon: ShieldCheck },
  { href: "/admin/teams", label: "Teams", icon: UsersRound },
];

export function Sidebar({
  showAdmin = false,
  unreadCount = 0,
  onNavigate,
  className,
}: {
  showAdmin?: boolean;
  unreadCount?: number;
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const groups = showAdmin
    ? [
        { label: "Workspace", items: workspace },
        { label: "Admin", items: adminNav },
      ]
    : [{ label: "Workspace", items: workspace }];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur-xl transition-transform duration-200 dark:border-slate-800 dark:bg-slate-950/95 lg:static lg:z-auto",
        className
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-slate-200/80 px-5 dark:border-slate-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/30">
          <Building className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">EstateCRM</p>
          <p className="truncate text-xs text-slate-500">Real estate workspace</p>
        </div>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                const showBadge = item.href === "/inbox" && unreadCount > 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {showBadge ? (
                      <span
                        className={cn(
                          "rounded-full px-1.5 text-[10px] font-semibold",
                          active ? "bg-white/20 text-white" : "bg-emerald-600 text-white"
                        )}
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
