"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";

export function AppShell({
  children,
  name,
  role,
  showAdmin = false,
}: {
  children: React.ReactNode;
  name?: string | null;
  role?: string;
  showAdmin?: boolean;
}) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenPath(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="flex min-h-dvh bg-slate-50 dark:bg-slate-950">
      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={() => setOpenPath(null)}
        />
      ) : null}
      <Sidebar
        showAdmin={showAdmin}
        onNavigate={() => setOpenPath(null)}
        className={
          open
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar name={name} role={role} onMenu={() => setOpenPath(pathname)} menuOpen={open} />
        <main className="flex-1 px-4 py-4 pb-24 sm:px-6 sm:py-6 lg:px-8 lg:pb-8">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
