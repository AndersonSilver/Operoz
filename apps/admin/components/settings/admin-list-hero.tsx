import type { LucideIcon } from "lucide-react";
import { cn } from "@operoz/utils";
import "./admin-list.css";

export type AdminHighlight = {
  label: string;
  icon: LucideIcon;
  tone?: "accent" | "warning" | "purple" | "success";
};

const HIGHLIGHT_TONE: Record<NonNullable<AdminHighlight["tone"]>, string> = {
  accent: "border-accent-subtle/50 bg-accent-subtle/30 text-accent-primary",
  warning: "border-warning-subtle/50 bg-warning-subtle/30 text-warning-primary",
  purple:
    "border-[var(--extended-color-purple-500)]/25 bg-[var(--extended-color-purple-500)]/10 text-[var(--extended-color-purple-500)]",
  success: "border-success-subtle/50 bg-success-subtle/30 text-success-primary",
};

type AdminListHeroProps = {
  icon: LucideIcon;
  title: string;
  description: React.ReactNode;
  highlights?: AdminHighlight[];
  actions?: React.ReactNode;
  accentClass?: string;
  gradientClass?: string;
  brandLabel?: string;
};

export function AdminListHero(props: AdminListHeroProps) {
  const {
    icon: Icon,
    title,
    description,
    highlights,
    actions,
    accentClass = "bg-accent-subtle text-accent-primary",
    gradientClass = "from-accent-subtle/40",
    brandLabel = "Operoz · God Mode",
  } = props;

  return (
    <section className="shadow-xs relative overflow-hidden rounded-xl border border-subtle bg-layer-1">
      <div
        className={cn(
          "admin-hero-dot-grid pointer-events-none absolute inset-0 opacity-60",
          "bg-gradient-to-br via-transparent to-transparent",
          gradientClass
        )}
        aria-hidden
      />

      <div className="relative flex flex-col gap-5 p-5 lg:flex-row lg:items-stretch lg:justify-between lg:p-6">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <span
            className={cn(
              "shadow-sm grid size-12 shrink-0 place-items-center rounded-xl border border-subtle",
              accentClass
            )}
          >
            <Icon className="size-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="tracking-widest text-11 font-semibold text-tertiary uppercase">{brandLabel}</p>
            <h1 className="mt-0.5 text-18 font-semibold tracking-tight text-primary">{title}</h1>
            <div className="mt-2 text-13 leading-relaxed text-secondary">{description}</div>
            {highlights && highlights.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {highlights.map((item) => {
                  const ItemIcon = item.icon;
                  const tone = HIGHLIGHT_TONE[item.tone ?? "accent"];
                  return (
                    <li
                      key={item.label}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-11 font-medium",
                        tone
                      )}
                    >
                      <ItemIcon className="size-3" strokeWidth={2} />
                      {item.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-col justify-center gap-2 lg:items-end lg:border-l lg:border-subtle lg:pl-6">
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  );
}
