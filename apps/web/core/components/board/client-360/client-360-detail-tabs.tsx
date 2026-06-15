"use client";

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

export function Client360DetailTabList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Tabs.List
      className={cn(
        "shadow-xs flex w-full max-w-full justify-start gap-1 rounded-xl border border-subtle bg-layer-1 p-1",
        className
      )}
    >
      {children}
    </Tabs.List>
  );
}

export function Client360DetailTabTrigger({ value, children }: { value: string; children: ReactNode }) {
  return (
    <Tabs.Trigger
      value={value}
      size="md"
      className={cn(
        "min-w-0 flex-1 rounded-lg border border-transparent px-4 py-2.5 font-medium",
        "text-secondary transition-all duration-200",
        "hover:bg-layer-2/70 hover:text-primary",
        "data-[selected]:shadow-xs data-[selected]:border-subtle data-[selected]:bg-layer-2 data-[selected]:font-semibold data-[selected]:text-primary",
        "data-[selected]:raised-200 data-[selected]:hover:bg-layer-2"
      )}
    >
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
