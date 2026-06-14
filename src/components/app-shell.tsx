"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Layers, LogOut, Menu, X } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { FleetProvider } from "@/components/fleet-provider";
import { LiveStatusBar } from "@/components/live-status-bar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { activeNavItem, navItems } from "@/lib/nav";

export function AppShell({ name, account, children }: { name: string; account: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = activeNavItem(pathname);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <FleetProvider>
      <div className="flex min-h-dvh bg-background text-foreground">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex w-64 flex-col gap-2 border-r border-border bg-card/60 p-3 backdrop-blur-xl transition-transform lg:static lg:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between gap-3 px-2 py-1.5">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-teal-600 to-emerald-500 text-white shadow-lg shadow-teal-600/25">
                <Layers className="size-4" />
              </div>
              <div>
                <div className="font-heading text-sm font-semibold leading-tight">FleetView</div>
                <div className="text-[11px] text-muted-foreground">Tracksolid Pro</div>
              </div>
            </div>
            <Button size="icon-sm" variant="ghost" className="lg:hidden" onClick={() => setMobileOpen(false)}>
              <X className="size-4" />
            </Button>
          </div>

          <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto pt-1">
            {navItems.map((item) => {
              const isActive = item.href === active.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  data-active={isActive || undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors",
                    "hover:bg-muted hover:text-foreground",
                    isActive && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-xl border border-border bg-background/60 p-2.5">
            <div className="flex items-center gap-2.5 px-1">
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary uppercase">
                {(name || account || "U").slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{name || account}</div>
                <div className="truncate text-[11px] text-muted-foreground">{account}</div>
              </div>
              <form action={logout}>
                <Button size="icon-sm" variant="ghost" type="submit" title="Sign out">
                  <LogOut className="size-4" />
                </Button>
              </form>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {mobileOpen ? (
          <div className="fixed inset-0 z-30 bg-foreground/30 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
        ) : null}

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl">
            <Button size="icon-sm" variant="outline" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="size-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="truncate font-heading text-lg font-semibold leading-tight">{active.label}</h1>
              <p className="truncate text-xs text-muted-foreground">{active.description}</p>
            </div>
            <div className="ml-auto">
              <LiveStatusBar />
            </div>
          </header>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </FleetProvider>
  );
}
