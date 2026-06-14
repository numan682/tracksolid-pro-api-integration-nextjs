"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Page body with consistent padding. */
export function PageBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("p-4 sm:p-5", className)}>{children}</div>;
}

/** Two-column workspace: a controls rail + the main content area. */
export function Workspace({ aside, children }: { aside: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">{aside}</div>
      <div className="flex min-w-0 flex-col gap-4">{children}</div>
    </div>
  );
}

export function Panel({
  icon: Icon,
  title,
  description,
  action,
  className,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card size="sm" className={className}>
      <CardHeader className={action ? "grid-cols-[1fr_auto] items-center gap-2" : undefined}>
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2">
            {Icon ? <Icon className="size-4 text-primary" /> : null}
            {title}
          </CardTitle>
          {description ? <CardDescription className="mt-1">{description}</CardDescription> : null}
        </div>
        {action}
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

export function StatTile({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "primary" | "emerald" | "amber" | "rose";
}) {
  const tones: Record<string, string> = {
    default: "text-foreground",
    primary: "text-primary",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
  };
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3 px-3">
        {Icon ? (
          <div className={cn("grid size-9 place-items-center rounded-lg bg-muted", tones[tone])}>
            <Icon className="size-4" />
          </div>
        ) : null}
        <div className="min-w-0">
          <div className="text-[11px] tracking-wide text-muted-foreground uppercase">{label}</div>
          <div className={cn("truncate text-xl font-semibold", tones[tone])}>{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
