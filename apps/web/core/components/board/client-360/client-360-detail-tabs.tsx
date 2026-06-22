"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Tabs } from "@operis/propel/tabs";
import { cn } from "@operis/utils";

export function Client360DetailTabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Tabs
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange ? (next) => next && onValueChange(next) : undefined}
      className={cn("gap-5", className)}
    >
      {children}
    </Tabs>
  );
}

export function Client360DetailTabList({
  children,
  className,
  contained,
}: {
  children: ReactNode;
  className?: string;
  /** Tabs inside a content panel (no outer card chrome). */
  contained?: boolean;
}) {
  return (
    <Tabs.List
      className={cn(
        contained
          ? "flex w-full max-w-full !justify-start gap-1.5 border-0 bg-transparent p-0 shadow-none"
          : "shadow-xs flex w-full max-w-full justify-start gap-1.5 rounded-xl border border-subtle bg-layer-1 p-1.5",
        className
      )}
    >
      {children}
    </Tabs.List>
  );
}

export function Client360DetailTabTrigger({
  value,
  icon: Icon,
  children,
}: {
  value: string;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <Tabs.Trigger
      value={value}
      size="md"
      className={cn(
        "inline-flex !w-auto min-w-fit shrink-0 items-center gap-1.5 rounded-lg border border-transparent px-3 py-2 font-medium sm:px-4",
        "text-secondary transition-all duration-200",
        "hover:bg-layer-2/70 hover:text-primary",
        "data-[selected]:shadow-xs data-[selected]:border-subtle data-[selected]:bg-layer-2 data-[selected]:font-semibold data-[selected]:text-primary",
        "data-[selected]:raised-200 data-[selected]:hover:bg-layer-2"
      )}
    >
      {Icon ? <Icon className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden /> : null}
      {children}
    </Tabs.Trigger>
  );
}

export function Client360DetailTabPanel({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Tabs.Content value={value} className={cn("mt-2 outline-none", className)}>
      {children}
    </Tabs.Content>
  );
}
