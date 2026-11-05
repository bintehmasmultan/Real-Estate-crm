"use client";

import { Menu, Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function initials(name?: string | null) {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Topbar({
  name,
  role,
  onMenu,
  menuOpen = false,
}: {
  name?: string | null;
  role?: string;
  onMenu?: () => void;
  menuOpen?: boolean;
}) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  async function handleSignOut() {
    try {
      await signOut(auth);
    } catch {
      // ignore client sign-out errors
    }
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/80 px-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80 sm:px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className="lg:hidden"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={onMenu}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            Welcome back{name ? `, ${name.split(" ")[0]}` : ""}
          </p>
          <p className="truncate text-xs text-slate-500">Leads, listings, and deals</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <div className="hidden items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 dark:border-slate-800 sm:flex">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-semibold text-white">
            {initials(name)}
          </span>
          {role ? <Badge variant="info">{role}</Badge> : null}
        </div>
        {role ? (
          <Badge variant="info" className="sm:hidden">
            {role}
          </Badge>
        ) : null}
        <Button
          variant="ghost"
          size="icon"
          type="button"
          aria-label="Toggle color theme"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 dark:hidden" />
          <Moon className="hidden h-4 w-4 dark:block" />
        </Button>
        <Button variant="outline" size="sm" type="button" onClick={handleSignOut} aria-label="Sign out">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
