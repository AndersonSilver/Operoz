import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@operis/utils";
import { CLIENT_360_TONE, type Client360Tone } from "@/components/board/client-360/client-360-tokens";

export function Client360BentoGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-1 gap-4 md:auto-rows-min md:grid-cols-12", className)}>{children}</div>;
}

export function Client360BentoTile({
  title,
  icon: Icon,
  iconTone = "neutral",
  badge,
  action,
  children,
  className,
  bodyClassName,
  noPadding,
  highlight,
}: {
  title: string;
  icon?: LucideIcon;
  iconTone?: Client360Tone;
  badge?: string | number;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  noPadding?: boolean;
  /** Subtle top accent using the tile tone */
  highlight?: boolean;
}) {
  const tone = CLIENT_360_TONE[iconTone];

  return (
    <article
      className={cn(
        "group shadow-xs hover:shadow-sm flex min-h-0 flex-col overflow-hidden rounded-xl border border-subtle bg-layer-1 transition-shadow",
        highlight && "ring-1 ring-subtle ring-inset",
        className
      )}
    >
      {highlight ? <div className="bg-border-subtle h-px w-full shrink-0" aria-hidden /> : null}
      <header className="flex items-center justify-between gap-2 border-b border-subtle/80 bg-layer-1/80 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon ? (
            <span className={cn("grid size-7 shrink-0 place-items-center rounded-md", tone.iconBg)}>
              <Icon className={cn("size-3.5", tone.icon)} strokeWidth={1.75} />
            </span>
          ) : null}
          <h3 className="truncate text-13 font-semibold tracking-tight text-primary">{title}</h3>
          {badge != null ? (
            <span className="rounded-full bg-layer-2 px-2 py-0.5 text-10 font-semibold text-secondary tabular-nums">
              {badge}
            </span>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className={cn("min-h-0 flex-1", !noPadding && "p-4", bodyClassName)}>{children}</div>
    </article>
  );
}

export function Client360BentoMetric({
  label,
  value,
  tone = "neutral",
  icon: Icon,
  onClick,
  className,
  align = "start",
  emphasizeValue = false,
}: {
  label: string;
  value: string | number;
  tone?: Client360Tone;
  icon?: LucideIcon;
  onClick?: () => void;
  className?: string;
  align?: "start" | "center";
  /** Colorize the numeric value (e.g. active alerts). Default keeps values neutral. */
  emphasizeValue?: boolean;
}) {
  const t = CLIENT_360_TONE[tone];
  const Tag = onClick ? "button" : "div";
  const centered = align === "center";
  const valueTone =
    emphasizeValue && (tone === "danger" || tone === "warning")
      ? tone === "danger"
        ? "text-danger-secondary"
        : "text-warning-primary"
      : "text-primary";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex min-w-0 flex-col gap-1 px-4 py-3 transition-colors",
        centered ? "items-center text-center" : "text-left",
        onClick && "cursor-pointer hover:bg-layer-transparent-hover",
        className
      )}
    >
      <span className="flex items-center gap-1.5">
        {Icon ? <Icon className={cn("size-3.5 shrink-0", t.icon)} strokeWidth={1.75} /> : null}
        <span className="tracking-wider truncate text-10 font-semibold text-tertiary uppercase">{label}</span>
      </span>
      <span className={cn("text-22 leading-none font-semibold tracking-tight tabular-nums", valueTone)}>{value}</span>
    </Tag>
  );
}
