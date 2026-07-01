"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@operoz/utils";
import { CLIENT_360_TONE, type Client360Tone } from "@/components/board/client-360/client-360-tokens";
import { useClient360DetailSection } from "@/components/board/client-360/client-360-detail-section-context";
import { useClient360SectionOpen } from "@/components/board/client-360/use-client-360-section-open";

export function Client360DetailGroup({
  sectionId,
  icon: Icon,
  title,
  description,
  children,
  className,
  iconTone = "neutral",
}: {
  sectionId: string;
  icon?: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  iconTone?: Client360Tone;
}) {
  const { collapsible, defaultOpen, collapseScope } = useClient360DetailSection(sectionId);
  const storageKey = collapseScope ? `${collapseScope}:${sectionId}` : undefined;
  const { open, toggle } = useClient360SectionOpen(storageKey, defaultOpen);
  const tone = CLIENT_360_TONE[iconTone];

  return (
    <section className={cn("overflow-hidden rounded-md border border-subtle bg-layer-1", className)}>
      <div
        className={cn(
          "flex items-center justify-between gap-3 border-b border-subtle px-3 py-2.5",
          collapsible && "cursor-pointer select-none hover:bg-layer-transparent-hover"
        )}
        role={collapsible ? "button" : undefined}
        tabIndex={collapsible ? 0 : undefined}
        aria-expanded={collapsible ? open : undefined}
        onClick={collapsible ? toggle : undefined}
        onKeyDown={
          collapsible
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  toggle();
                }
              }
            : undefined
        }
      >
        <div className="flex min-w-0 items-center gap-2">
          {Icon ? (
            <span className="grid size-6 shrink-0 place-items-center rounded-sm bg-layer-2">
              <Icon className={cn("size-3.5", tone.icon)} strokeWidth={1.75} />
            </span>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-13 font-semibold text-primary">{title}</h2>
            {description && (!collapsible || open) ? (
              <p className="mt-0.5 text-12 text-tertiary">{description}</p>
            ) : null}
          </div>
        </div>
        {collapsible ? (
          <ChevronDown
            className={cn("size-4 shrink-0 text-tertiary transition-transform", !open && "-rotate-90")}
            strokeWidth={1.75}
            aria-hidden
          />
        ) : null}
      </div>
      {(!collapsible || open) && <div className="flex flex-col gap-3 p-3">{children}</div>}
    </section>
  );
}

export function Client360DetailTwoColumn({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-start">{children}</div>;
}

export function Client360DetailStack({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3">{children}</div>;
}

export function Client360CompactMetric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: Client360Tone;
}) {
  const t = CLIENT_360_TONE[tone];

  return (
    <div className="rounded-lg border border-subtle bg-layer-2/40 px-3 py-2.5">
      <p className="tracking-wider text-10 font-semibold text-tertiary uppercase">{label}</p>
      <p className={cn("mt-1 text-20 leading-none font-semibold tracking-tight tabular-nums", t.icon)}>{value}</p>
    </div>
  );
}

export function Client360SubPanel({
  title,
  children,
  className,
  noPadding,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}) {
  return (
    <div className={cn("overflow-hidden rounded-lg border border-subtle bg-layer-1/80", className)}>
      <h3 className="tracking-wider border-b border-subtle/80 bg-layer-2/40 px-3 py-2 text-10 font-semibold text-tertiary uppercase">
        {title}
      </h3>
      <div className={cn(!noPadding && "p-3")}>{children}</div>
    </div>
  );
}
