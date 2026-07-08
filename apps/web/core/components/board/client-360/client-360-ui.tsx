import type { LucideIcon } from "lucide-react";
import { Client360PeriodDelta } from "@/components/board/client-360/client-360-period-delta";
import { Check, ChevronDown, ListFilter, Search } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { useTranslation } from "@operoz/i18n";
import { IconButton } from "@operoz/propel/icon-button";
import { Tooltip } from "@operoz/propel/tooltip";
import { CustomMenu } from "@operoz/ui";
import { cn } from "@operoz/utils";
import {
  CLIENT_360_FILTER_OPTIONS,
  type Client360FilterKey,
} from "@/components/board/client-360/client-360-client-filters";
import { BOARD_HUB_GLASS_BAR, useBoardHubHasBackground } from "@/components/board/board-hub-background";
import { CLIENT_360_TONE, type Client360Tone } from "@/components/board/client-360/client-360-tokens";
import { useClient360DetailSection } from "@/components/board/client-360/client-360-detail-section-context";
import { useClient360SectionOpen } from "@/components/board/client-360/use-client-360-section-open";
import "@/components/exporter/workspace-exports-settings.css";
import "@/components/board/client-360/client-360-workspace-polish.css";

export type { Client360Tone };

export function Client360PageShell({
  children,
  header,
  belowHeader,
}: {
  header: ReactNode;
  children: ReactNode;
  belowHeader?: ReactNode;
}) {
  const hasBackground = useBoardHubHasBackground();

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-canvas">
      <div
        className={cn(
          "relative shrink-0 overflow-hidden border-b border-subtle",
          hasBackground ? BOARD_HUB_GLASS_BAR : "bg-layer-1"
        )}
      >
        {!hasBackground ? (
          <div
            className="workspace-exports-hero-dot-grid pointer-events-none absolute inset-0 bg-gradient-to-br from-accent-subtle/25 via-transparent to-transparent opacity-60"
            aria-hidden
          />
        ) : null}
        <div className="relative w-full px-page-x py-5 lg:px-8 lg:py-6">
          {header}
          {belowHeader}
        </div>
      </div>
      <div className="flex min-h-0 w-full flex-1 flex-col gap-6 px-page-x py-6 lg:px-8 xl:gap-7 xl:py-8">
        {children}
      </div>
    </div>
  );
}

export function Client360PageTitle({
  icon: Icon,
  title,
  subtitle,
  trailing,
  iconTone = "neutral",
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  iconTone?: Client360Tone;
}) {
  const tone = CLIENT_360_TONE[iconTone];

  return (
    <div className="flex flex-wrap items-start justify-between gap-4 lg:gap-6">
      <div className="flex min-w-0 flex-1 items-start gap-3 lg:gap-4">
        <span
          className={cn(
            "shadow-sm grid size-11 shrink-0 place-items-center rounded-xl border border-subtle lg:size-12",
            iconTone === "neutral" ? "bg-accent-subtle text-accent-primary" : cn("bg-layer-1", tone.iconBg, tone.icon)
          )}
        >
          <Icon className="size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="tracking-widest text-11 font-semibold text-tertiary uppercase">Operoz</p>
          <h1 className="text-18 font-semibold tracking-tight text-primary lg:text-20">{title}</h1>
          {subtitle ? <p className="mt-1 max-w-3xl text-13 leading-relaxed text-secondary">{subtitle}</p> : null}
        </div>
      </div>
      {trailing ? <div className="flex shrink-0 flex-wrap items-center gap-2">{trailing}</div> : null}
    </div>
  );
}

export function Client360Section({
  icon: Icon,
  title,
  description,
  action,
  children,
  className,
  noPadding,
  iconTone = "neutral",
  sectionId,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  noPadding?: boolean;
  iconTone?: Client360Tone;
  /** When set inside Client360 detail, enables collapse + persistence via context. */
  sectionId?: string;
}) {
  const tone = CLIENT_360_TONE[iconTone];
  const { collapsible, defaultOpen, collapseScope } = useClient360DetailSection(sectionId);
  const storageKey = collapseScope && sectionId ? `${collapseScope}:${sectionId}` : undefined;
  const { open, toggle } = useClient360SectionOpen(storageKey, defaultOpen);

  return (
    <section className={cn("shadow-xs overflow-hidden rounded-xl border border-subtle bg-layer-1", className)}>
      <div
        className={cn(
          "flex justify-between gap-3 border-b border-subtle px-3 py-2.5",
          action ? "flex-nowrap items-center" : "flex-wrap items-start",
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
        <div className={cn("flex min-w-0 gap-2.5", action ? "items-center" : "items-start")}>
          {Icon ? (
            <span
              className={cn("grid size-7 shrink-0 place-items-center rounded-sm", tone.iconBg, !action && "mt-0.5")}
            >
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
        <div className="flex shrink-0 items-center gap-1">
          {action ? (
            <div className="flex items-center" onClick={(event) => event.stopPropagation()}>
              {action}
            </div>
          ) : null}
          {collapsible ? (
            <ChevronDown
              className={cn("size-4 text-tertiary transition-transform", !open && "-rotate-90")}
              strokeWidth={1.75}
              aria-hidden
            />
          ) : null}
        </div>
      </div>
      {(!collapsible || open) && <div className={cn(!noPadding && "p-3")}>{children}</div>}
    </section>
  );
}

export function Client360StatGrid({ children }: { children: ReactNode }) {
  return (
    <div className="bg-subtle grid grid-cols-2 gap-px overflow-hidden border-b border-subtle sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
      {children}
    </div>
  );
}

export function Client360StatTile({
  icon: Icon,
  label,
  value,
  tone = "neutral",
  highlightValue,
  variant = "default",
  onClick,
  ariaLabel,
  delta,
  deltaMode = "lower_is_better",
}: {
  icon?: LucideIcon;
  label: string;
  value: number | string;
  tone?: Client360Tone;
  highlightValue?: boolean;
  /** Compact tiles omit icons and use sentence-case labels (overview strip). */
  variant?: "default" | "compact";
  onClick?: () => void;
  ariaLabel?: string;
  delta?: number;
  deltaMode?: "lower_is_better" | "higher_is_better";
}) {
  const t = CLIENT_360_TONE[tone];

  if (variant === "compact") {
    const content = (
      <>
        <span className="text-12 text-tertiary">{label}</span>
        <div className="flex items-baseline gap-2">
          <span
            className={cn("text-20 leading-none font-semibold tabular-nums", highlightValue ? t.icon : "text-primary")}
          >
            {value}
          </span>
          {delta != null ? <Client360PeriodDelta delta={delta} mode={deltaMode} /> : null}
        </div>
      </>
    );

    if (onClick && Number(value) > 0) {
      return (
        <button
          type="button"
          onClick={onClick}
          aria-label={ariaLabel ?? label}
          className="focus-visible:outline-accent-primary flex flex-col gap-1 bg-layer-1 px-4 py-3.5 text-left transition-colors hover:bg-layer-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
        >
          {content}
        </button>
      );
    }

    return <div className="flex flex-col gap-1 bg-layer-1 px-4 py-3.5">{content}</div>;
  }

  if (!Icon) return null;

  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1 bg-layer-1 px-4 py-3.5">
      <span className={cn("col-start-1 row-start-1 grid size-7 shrink-0 place-items-center rounded-sm", t.iconBg)}>
        <Icon className={cn("size-3.5", t.icon)} strokeWidth={1.75} />
      </span>
      <span className="col-start-2 row-start-1 text-11 leading-tight font-medium tracking-wide text-tertiary uppercase">
        {label}
      </span>
      <span
        className={cn(
          "text-22 col-start-2 row-start-2 leading-none font-semibold tabular-nums",
          highlightValue ? t.icon : "text-primary"
        )}
      >
        {value}
      </span>
    </div>
  );
}

export type Client360StackedSegment = {
  key: string;
  label: string;
  value: number;
  tone: Client360Tone;
};

export function Client360StackedDistribution({
  segments,
  total,
  emptyLabel,
}: {
  segments: Client360StackedSegment[];
  total: number;
  emptyLabel?: string;
}) {
  const visible = segments.filter((s) => s.value > 0);
  if (total <= 0 || visible.length === 0) {
    return emptyLabel ? <p className="text-12 text-tertiary">{emptyLabel}</p> : null;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-2.5 overflow-hidden rounded-full bg-layer-2">
        {visible.map((segment) => {
          const pct = Math.max((segment.value / total) * 100, segment.value > 0 ? 3 : 0);
          const tone = CLIENT_360_TONE[segment.tone];
          return (
            <div
              key={segment.key}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{ width: `${pct}%`, backgroundColor: tone.bar, opacity: 0.38 }}
              title={`${segment.label}: ${segment.value}`}
            />
          );
        })}
      </div>
      <ul className="flex flex-col gap-2">
        {visible.map((segment) => {
          const pct = Math.round((segment.value / total) * 100);
          const tone = CLIENT_360_TONE[segment.tone];
          return (
            <li key={segment.key} className="flex items-center justify-between gap-3 text-12">
              <span className="flex min-w-0 items-center gap-2 text-secondary">
                <span className={cn("size-2 shrink-0 rounded-full", tone.dot)} />
                <span className="truncate">{segment.label}</span>
              </span>
              <span className="shrink-0 text-tertiary tabular-nums">
                {segment.value}
                <span className="ml-1 text-11">({pct}%)</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Client360OverviewBlock({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <h3 className="mb-3 text-12 font-medium text-tertiary">{title}</h3>
      {children}
    </div>
  );
}

export function Client360ToolbarDivider() {
  return <span className="bg-subtle mx-0.5 hidden h-5 w-px shrink-0 sm:block" aria-hidden />;
}

export function Client360SearchInput({
  value,
  onChange,
  placeholder,
  inputRef,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputRef?: RefObject<HTMLInputElement>;
  className?: string;
}) {
  return (
    <div className={cn("relative w-[200px] max-w-[40vw] shrink-0", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-tertiary"
        strokeWidth={1.75}
      />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 w-full rounded-sm border border-subtle bg-layer-2 py-1.5 pr-3 pl-8 text-13 text-primary placeholder:text-tertiary focus:border-strong focus:outline-none"
      />
    </div>
  );
}

export function Client360FilterMenu({
  filter,
  onFilterChange,
  className,
}: {
  filter: Client360FilterKey;
  onFilterChange: (key: Client360FilterKey) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const activeOption = CLIENT_360_FILTER_OPTIONS.find((o) => o.key === filter);
  const ActiveIcon = activeOption?.icon ?? ListFilter;
  const filtersLabel = t("boards.client_360.filters_label");

  return (
    <CustomMenu
      className={className}
      placement="bottom-end"
      closeOnSelect
      customButton={
        <Tooltip tooltipContent={filtersLabel}>
          <span className="inline-flex">
            <IconButton
              variant="secondary"
              size="xl"
              icon={filter === "all" ? ListFilter : ActiveIcon}
              aria-label={filtersLabel}
              className={cn("shrink-0 rounded-sm", filter !== "all" && "text-accent-primary")}
            />
          </span>
        </Tooltip>
      }
    >
      {CLIENT_360_FILTER_OPTIONS.map(({ key, labelKey, icon: Icon }) => {
        const isActive = filter === key;
        return (
          <CustomMenu.MenuItem key={key} className="flex items-center gap-2" onClick={() => onFilterChange(key)}>
            <Icon className="size-3.5 shrink-0 text-tertiary" strokeWidth={1.75} />
            <span className={cn("min-w-0 flex-1 truncate", isActive && "font-medium text-primary")}>{t(labelKey)}</span>
            {isActive ? <Check className="size-3.5 shrink-0 text-accent-primary" strokeWidth={2.5} /> : null}
          </CustomMenu.MenuItem>
        );
      })}
    </CustomMenu>
  );
}

export function Client360BreakdownRow({
  label,
  value,
  total,
  tone = "neutral",
}: {
  label: string;
  value: number;
  total: number;
  tone?: Client360Tone;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const t = CLIENT_360_TONE[tone];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2 text-12">
        <span className="flex min-w-0 items-center gap-1.5 truncate text-secondary">
          <span className={cn("size-1.5 shrink-0 rounded-full", t.dot)} />
          {label}
        </span>
        <span className="shrink-0 text-tertiary tabular-nums">
          {value}
          <span className="ml-1 text-11">({pct}%)</span>
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-layer-2">
        <div className="h-full rounded-full opacity-90" style={{ width: `${pct}%`, backgroundColor: t.bar }} />
      </div>
    </div>
  );
}

export function Client360MetaChip({
  icon: Icon,
  children,
  tone = "neutral",
}: {
  icon: LucideIcon;
  children: ReactNode;
  tone?: Client360Tone;
}) {
  const t = CLIENT_360_TONE[tone];

  return (
    <span className="inline-flex items-center gap-1.5 text-12 text-secondary">
      <Icon className={cn("size-3.5 shrink-0", t.icon)} strokeWidth={1.75} />
      <span>{children}</span>
    </span>
  );
}

export function Client360ReportProgress({
  published,
  total,
  label,
}: {
  published: number;
  total: number;
  label: string;
}) {
  const pct = total > 0 ? Math.round((published / total) * 100) : 0;
  const barTone: Client360Tone = pct >= 100 ? "success" : pct > 0 ? "warning" : "danger";
  const t = CLIENT_360_TONE[barTone];

  return (
    <div className="mt-3">
      <div className="mb-1.5 flex justify-between gap-2 text-11 text-tertiary">
        <span className="flex items-center gap-1.5">
          <span className={cn("size-1.5 rounded-full", t.dot)} />
          {label}
        </span>
        <span className="text-secondary tabular-nums">
          {published}/{total}
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-layer-2">
        <div
          className="h-full rounded-full opacity-90"
          style={{ width: `${Math.max(pct, pct > 0 ? 4 : 0)}%`, backgroundColor: t.bar }}
        />
      </div>
    </div>
  );
}

export function Client360ClientPeople({
  stakeholder,
  responsibleName,
  stakeholderLabel,
  responsibleLabel,
  className,
  compact,
}: {
  stakeholder?: string;
  responsibleName?: string | null;
  stakeholderLabel: string;
  responsibleLabel: string;
  className?: string;
  compact?: boolean;
}) {
  const hasStakeholder = Boolean(stakeholder?.trim());
  const hasResponsible = Boolean(responsibleName?.trim());
  if (!hasStakeholder && !hasResponsible) return null;

  const rowClass = compact
    ? "flex flex-col gap-0.5 text-11"
    : "flex flex-col gap-1 text-12 sm:flex-row sm:flex-wrap sm:gap-x-4";

  return (
    <div className={cn(rowClass, className)}>
      {hasStakeholder ? (
        <p className="text-tertiary">
          <span className="text-tertiary">{stakeholderLabel}:</span>{" "}
          <span className="text-secondary">{stakeholder}</span>
        </p>
      ) : null}
      {hasResponsible ? (
        <p className="text-tertiary">
          <span className="text-tertiary">{responsibleLabel}:</span>{" "}
          <span className="text-secondary">{responsibleName}</span>
        </p>
      ) : null}
    </div>
  );
}

export function Client360StatusLozenge({ status }: { status: "published" | "draft" | "missing" }) {
  const tone: Client360Tone = status === "published" ? "success" : status === "draft" ? "warning" : "danger";
  const t = CLIENT_360_TONE[tone];

  return <span className={cn("inline-block size-1.5 shrink-0 rounded-full", t.dot)} />;
}
