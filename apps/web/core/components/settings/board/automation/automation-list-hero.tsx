import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";
import { Button } from "@operis/propel/button";
import { cn } from "@operis/ui";
import { AutomationHeroIllustration } from "./automation-hero-illustration";
import "./automation-list.css";

export type AutomationHighlight = {
  label: string;
  icon: LucideIcon;
  tone?: "accent" | "warning" | "purple" | "success";
};

const HIGHLIGHT_TONE: Record<NonNullable<AutomationHighlight["tone"]>, string> = {
  accent: "border-accent-subtle/50 bg-accent-subtle/30 text-accent-primary",
  warning: "border-warning-subtle/50 bg-warning-subtle/30 text-warning-primary",
  purple:
    "border-[var(--extended-color-purple-500)]/25 bg-[var(--extended-color-purple-500)]/10 text-[var(--extended-color-purple-500)]",
  success: "border-success-subtle/50 bg-success-subtle/30 text-success-primary",
};

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  createLabel: string;
  createHint?: string;
  creating?: boolean;
  onCreate: () => void;
  highlights?: AutomationHighlight[];
  accentClass?: string;
  gradientClass?: string;
  showIllustration?: boolean;
  showCreateAction?: boolean;
};

export function AutomationListHero(props: Props) {
  const {
    icon: Icon,
    title,
    description,
    createLabel,
    createHint,
    creating,
    onCreate,
    highlights,
    accentClass = "bg-accent-subtle text-accent-primary",
    gradientClass = "from-accent-subtle/40",
    showIllustration = true,
    showCreateAction = true,
  } = props;

  return (
    <section className="relative overflow-hidden rounded-xl border border-subtle bg-layer-1">
      <div
        className={cn(
          "automation-hero-dot-grid pointer-events-none absolute inset-0 opacity-60",
          "bg-gradient-to-br via-transparent to-transparent",
          gradientClass
        )}
        aria-hidden
      />

      <div className="relative flex flex-col gap-6 p-5 lg:flex-row lg:items-stretch lg:justify-between lg:p-6">
        <div className="flex min-w-0 flex-1 flex-col gap-5 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-start gap-4">
            <span
              className={cn(
                "grid size-12 shrink-0 place-items-center rounded-xl border border-subtle shadow-sm",
                accentClass
              )}
            >
              <Icon className="size-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-11 font-semibold uppercase tracking-widest text-tertiary">Operoz</p>
              <h1 className="mt-0.5 text-18 font-semibold tracking-tight text-primary">{title}</h1>
              <p className="mt-2 max-w-lg text-13 leading-relaxed text-secondary">{description}</p>
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

          {showIllustration && (
            <div className="hidden shrink-0 items-center justify-center lg:flex lg:px-4">
              <AutomationHeroIllustration />
            </div>
          )}
        </div>

        {showCreateAction && (
          <div className="flex shrink-0 flex-col justify-center gap-2 lg:items-end lg:border-l lg:border-subtle lg:pl-6">
            <Button
              variant="primary"
              size="lg"
              onClick={onCreate}
              loading={creating}
              className="w-full shadow-sm lg:min-w-[11rem]"
            >
              <Plus className="size-4" />
              {createLabel}
            </Button>
            {createHint && (
              <p className="max-w-[11rem] text-center text-11 leading-relaxed text-placeholder lg:text-right">
                {createHint}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
