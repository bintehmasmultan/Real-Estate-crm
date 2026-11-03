"use client";

import { Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Topbar({
  name,
  role,
}: {
  name?: string | null;
  role?: string;
}) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 md:px-6">
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
          Welcome back{name ? `, ${name.split(" ")[0]}` : ""}
        </p>
        <p className="text-xs text-slate-500">Manage leads, listings, and deals</p>
      </div>
      <div className="flex items-center gap-2">
        {role ? <Badge variant="info">{role}</Badge> : null}
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 dark:hidden" />
          <Moon className="hidden h-4 w-4 dark:block" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </header>
  );
}
