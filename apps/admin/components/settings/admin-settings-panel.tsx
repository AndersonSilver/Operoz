import type { LucideIcon } from "lucide-react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import Link from "next/link";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
import { Controller } from "react-hook-form";
import { useTranslation } from "@operoz/i18n";
import { ToggleSwitch, Input } from "@operoz/ui";
import { cn } from "@operoz/utils";
import "./admin-list.css";

type AdminSettingsPanelProps = {
  chip?: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  iconClassName?: string;
  accentClassName?: string;
  children: React.ReactNode;
  className?: string;
  fillHeight?: boolean;
  glowActive?: boolean;
};

export function AdminSettingsPanel(props: AdminSettingsPanelProps) {
  const {
    chip,
    title,
    description,
    icon: Icon,
    iconClassName = "text-accent-primary",
    accentClassName = "bg-accent-primary",
    children,
    className,
    fillHeight,
    glowActive,
  } = props;

  return (
    <section
      className={cn(
        "group shadow-xs relative overflow-hidden rounded-xl border border-subtle bg-layer-1 transition-all duration-150",
        "hover:border-strong hover:shadow-raised-100",
        glowActive && "admin-card-glow-active border-accent-subtle/40",
        fillHeight && "flex h-full flex-col",
        className
      )}
    >
      <div className="admin-panel-dot-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <header className="relative shrink-0 border-b border-subtle px-4 py-4 sm:px-5">
        <span className={cn("absolute top-3 bottom-3 left-0 w-0.5 rounded-full", accentClassName)} aria-hidden />
        <div className="flex items-start gap-3 pl-2">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-subtle bg-layer-2">
            <Icon className={cn("size-4", iconClassName)} strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            {chip ? (
              <span className="mb-1 inline-flex rounded-full bg-layer-2 px-2 py-0.5 text-10 font-semibold tracking-wide text-tertiary uppercase">
                {chip}
              </span>
            ) : null}
            <h3 className="text-14 leading-tight font-semibold text-primary">{title}</h3>
            {description ? <p className="mt-1 text-12 leading-relaxed text-tertiary">{description}</p> : null}
          </div>
        </div>
      </header>
      <div className={cn("relative p-4 sm:p-5", fillHeight && "flex min-h-0 flex-1 flex-col")}>{children}</div>
    </section>
  );
}

export function AdminConfigSection(props: { title: string; children: React.ReactNode; className?: string }) {
  const { title, children, className } = props;

  return (
    <section className={cn("space-y-3", className)}>
      <p className="text-11 font-semibold tracking-wide text-tertiary uppercase">{title}</p>
      {children}
    </section>
  );
}

type AdminOpsMetricProps = {
  label: string;
  value: string;
  hint?: string;
  tone?: "success" | "neutral" | "accent" | "warning";
  compact?: boolean;
};

const TILE_TONE: Record<NonNullable<AdminOpsMetricProps["tone"]>, string> = {
  success: "text-success-primary",
  neutral: "text-primary",
  accent: "text-accent-primary",
  warning: "text-warning-primary",
};

export function AdminOpsMetric(props: AdminOpsMetricProps) {
  const { label, value, hint, tone = "neutral", compact } = props;

  return (
    <div className={cn("min-w-0 flex-1 px-1 first:pl-0 last:pr-0 sm:px-4", compact && "px-3 sm:px-3")}>
      <p className="text-10 font-semibold tracking-wide text-tertiary uppercase">{label}</p>
      <p className={cn("mt-1 truncate text-16 font-semibold tracking-tight tabular-nums sm:text-18", TILE_TONE[tone])}>
        {value}
      </p>
      {hint ? <p className="mt-0.5 truncate text-11 text-tertiary">{hint}</p> : null}
    </div>
  );
}

type AdminOpsStripProps = {
  children: React.ReactNode;
  status?: { label: string; tone: "success" | "warning" | "neutral" };
};

export function AdminOpsStrip(props: AdminOpsStripProps) {
  const { children, status } = props;

  return (
    <div className="shadow-xs relative overflow-hidden rounded-xl border border-subtle bg-layer-1 transition-all duration-150 hover:border-strong hover:shadow-raised-100">
      <div className="admin-panel-dot-grid pointer-events-none absolute inset-0 opacity-35" aria-hidden />
      <div className="relative flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:gap-6">
        {status ? (
          <div className="flex shrink-0 items-center gap-2.5 rounded-full border border-subtle bg-layer-2/80 px-3 py-1.5 lg:max-w-[14rem]">
            <span
              className={cn(
                "size-2 shrink-0 rounded-full",
                status.tone === "success" && "bg-success-primary shadow-[0_0_8px_var(--bg-success-primary)]",
                status.tone === "warning" && "bg-warning-primary",
                status.tone === "neutral" && "bg-subtle"
              )}
              aria-hidden
            />
            <span className="text-12 leading-snug font-medium text-primary">{status.label}</span>
          </div>
        ) : null}
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-2 gap-y-4 sm:grid-cols-4 sm:gap-y-0 sm:divide-x sm:divide-subtle">
          {children}
        </div>
      </div>
    </div>
  );
}

type AdminToggleCardProps = {
  label: string;
  description: React.ReactNode;
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
};

export const AdminToggleCard = observer(function AdminToggleCard(props: AdminToggleCardProps) {
  const { label, description, value, onChange, disabled } = props;
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border px-4 py-3 transition-all duration-150",
        value
          ? "border-accent-subtle/50 bg-accent-subtle/10"
          : "border-subtle bg-layer-2/30 hover:border-strong hover:bg-layer-1-hover/30"
      )}
    >
      {value ? <span className="absolute inset-x-0 top-0 h-0.5 bg-accent-primary" aria-hidden /> : null}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-13 font-medium text-primary">{label}</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-10 font-semibold tracking-wide uppercase",
                value ? "bg-success-subtle text-success-primary" : "bg-layer-2 text-tertiary"
              )}
            >
              {value ? t("god_mode.common.active") : t("god_mode.common.inactive")}
            </span>
          </div>
          <p className="mt-0.5 text-11 leading-relaxed text-tertiary">{description}</p>
        </div>
        <ToggleSwitch value={value} onChange={onChange} size="sm" disabled={disabled} />
      </div>
    </div>
  );
});

type AdminMetricFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description: string;
  placeholder: string;
  maxReference?: number;
  tone?: "accent" | "warning" | "neutral" | "purple";
  error?: boolean;
  disabled?: boolean;
};

const METRIC_GLOW: Record<NonNullable<AdminMetricFieldProps<FieldValues>["tone"]>, string> = {
  accent: "after:bg-accent-primary",
  warning: "after:bg-warning-primary",
  neutral: "after:bg-subtle",
  purple: "after:bg-[var(--extended-color-purple-500,#8b5cf6)]",
};

const METRIC_BAR: Record<NonNullable<AdminMetricFieldProps<FieldValues>["tone"]>, string> = {
  accent: "bg-accent-primary",
  warning: "bg-warning-primary",
  neutral: "bg-tertiary/40",
  purple: "bg-[var(--extended-color-purple-500,#8b5cf6)]",
};

export function AdminMetricField<T extends FieldValues>(props: AdminMetricFieldProps<T>) {
  const {
    control,
    name,
    label,
    description,
    placeholder,
    maxReference = 100,
    tone = "neutral",
    error,
    disabled,
  } = props;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, ref } }) => {
        const numeric = Number.parseInt(String(value ?? ""), 10);
        const ratio = Number.isFinite(numeric) && maxReference > 0 ? Math.min(numeric / maxReference, 1) : 0;

        return (
          <div
            className={cn(
              "relative overflow-hidden rounded-xl border border-subtle bg-layer-2/40 p-4",
              "after:pointer-events-none after:absolute after:-top-3 after:-right-3 after:size-14 after:rounded-full after:opacity-20 after:blur-2xl",
              METRIC_GLOW[tone]
            )}
          >
            <p className="text-10 font-semibold tracking-wide text-tertiary uppercase">{label}</p>
            <Input
              id={String(name)}
              name={String(name)}
              type="text"
              inputMode="numeric"
              value={value ?? ""}
              onChange={onChange}
              ref={ref}
              disabled={disabled}
              hasError={error}
              placeholder={placeholder}
              className="mt-2 h-11 w-full rounded-lg border-subtle bg-layer-1 text-center text-20 font-semibold tracking-tight tabular-nums"
            />
            <div className="bg-subtle/80 mt-3 h-1 overflow-hidden rounded-full">
              <div
                className={cn("h-full rounded-full transition-all duration-200", METRIC_BAR[tone])}
                style={{ width: `${Math.max(ratio * 100, numeric > 0 ? 8 : 0)}%` }}
              />
            </div>
            <p className="mt-2 text-11 leading-relaxed text-tertiary">{description}</p>
          </div>
        );
      }}
    />
  );
}

export function AdminFieldLabel(props: { children: React.ReactNode }) {
  return <p className="text-11 font-semibold tracking-wide text-tertiary uppercase">{props.children}</p>;
}

export function AdminConfigCallout(props: { children: React.ReactNode; variant?: "default" | "accent" }) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        props.variant === "accent" ? "border-accent-subtle/40 bg-accent-subtle/10" : "border-subtle bg-layer-2/50"
      )}
    >
      <p className="text-11 leading-relaxed text-secondary">{props.children}</p>
    </div>
  );
}

export function AdminFormFooter(props: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-2 border-t border-subtle bg-surface-1/95 px-4 py-4 backdrop-blur-md sm:-mx-5 sm:px-5">
      <div className="rounded-xl border border-subtle bg-layer-1/80 px-4 py-3 shadow-raised-100 sm:px-5">
        {props.children}
      </div>
    </div>
  );
}

type AdminReadOnlyFieldProps = {
  label: string;
  value: string;
  mono?: boolean;
};

export function AdminReadOnlyField(props: AdminReadOnlyFieldProps) {
  const { label, value, mono } = props;

  return (
    <div className="space-y-2">
      <AdminFieldLabel>{label}</AdminFieldLabel>
      <div
        className={cn(
          "rounded-xl border border-subtle bg-layer-2/40 px-3 py-2.5 text-13 text-secondary",
          mono && "font-mono truncate text-11"
        )}
      >
        {value || "—"}
      </div>
    </div>
  );
}

type AdminEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function AdminEmptyState(props: AdminEmptyStateProps) {
  const { icon: Icon, title, description, action } = props;

  return (
    <div className="relative overflow-hidden rounded-xl border border-dashed border-subtle bg-layer-2/20 px-6 py-10 text-center">
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-primary/25 to-transparent"
        aria-hidden
      />
      <span className="mx-auto grid size-12 place-items-center rounded-xl border border-subtle bg-layer-1">
        <Icon className="size-5 text-tertiary" strokeWidth={1.75} />
      </span>
      <h3 className="mt-4 text-14 font-semibold text-primary">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-12 leading-relaxed text-tertiary">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function AdminFormActions(props: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-3", props.className)}>{props.children}</div>;
}

type AdminCreateCardProps = {
  label: string;
  hint?: string;
  loading?: boolean;
  onClick: () => void;
  href?: string;
  accentClass?: string;
};

export function AdminCreateCard(props: AdminCreateCardProps) {
  const { label, hint, loading, onClick, href, accentClass = "text-accent-primary" } = props;

  const className = cn(
    "group flex h-full min-h-[200px] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-subtle",
    "bg-transparent px-4 py-8 text-center transition-all duration-150",
    "hover:border-accent-subtle hover:bg-accent-subtle/10",
    "focus-visible:ring-accent-primary focus-visible:ring-offset-surface-1 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
    loading && "pointer-events-none opacity-60"
  );

  const content = (
    <>
      <span
        className={cn(
          "grid size-11 place-items-center rounded-xl border border-subtle bg-layer-1 transition-colors",
          "group-hover:border-accent-subtle group-hover:bg-accent-subtle/30",
          accentClass
        )}
      >
        <Plus className="size-5" strokeWidth={1.75} />
      </span>
      <span className="text-13 font-semibold text-primary">{label}</span>
      {hint && <span className="max-w-[12rem] text-11 leading-relaxed text-tertiary">{hint}</span>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" disabled={loading} onClick={onClick} className={className}>
      {content}
    </button>
  );
}

type AdminGridCardProps = {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  isActive?: boolean;
  badges?: React.ReactNode;
  meta?: React.ReactNode;
  footer: React.ReactNode;
  accentBarClass?: string;
  className?: string;
};

export function AdminGridCard(props: AdminGridCardProps) {
  const {
    icon,
    title,
    description,
    isActive = false,
    badges,
    meta,
    footer,
    accentBarClass = "bg-accent-primary",
    className,
  } = props;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border border-subtle bg-layer-1 transition-all duration-150",
        "hover:border-strong hover:shadow-raised-100",
        isActive && "admin-card-glow-active border-accent-subtle/40",
        className
      )}
    >
      <span className={cn("absolute inset-x-0 top-0 h-0.5", isActive ? accentBarClass : "bg-subtle")} aria-hidden />
      <div className="relative flex flex-1 flex-col p-4 pb-3">
        <div className="admin-panel-dot-grid pointer-events-none absolute inset-0 opacity-25" aria-hidden />
        <div className="relative flex items-start justify-between gap-2">
          {icon}
          {badges}
        </div>
        <h3 className="relative mt-3 line-clamp-2 text-14 leading-snug font-semibold text-primary">{title}</h3>
        <div className="relative mt-1 line-clamp-3 text-13 leading-relaxed text-tertiary">{description}</div>
        {meta ? <div className="relative mt-3">{meta}</div> : null}
      </div>
      <div className="relative border-t border-subtle bg-surface-1/70 px-3 py-2.5">{footer}</div>
    </article>
  );
}

/** @deprecated Use AdminOpsMetric inside AdminOpsStrip */
export function AdminStatusTile(props: AdminOpsMetricProps) {
  return (
    <div className="rounded-xl border border-subtle bg-layer-1 p-4">
      <AdminOpsMetric {...props} />
    </div>
  );
}
