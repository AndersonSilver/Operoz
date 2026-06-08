import type { ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { Switch } from "@operis/propel/switch";
import { cn } from "@operis/ui";
import "./automation-list.css";

type Props = {
  icon: ReactNode;
  title: string;
  isActive: boolean;
  description?: ReactNode;
  visual?: ReactNode;
  badges?: ReactNode;
  meta?: ReactNode;
  accentBarClass?: string;
  onOpen: () => void;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
};

export function AutomationGridCard(props: Props) {
  const {
    icon,
    title,
    isActive,
    description,
    visual,
    badges,
    meta,
    accentBarClass = "bg-accent-primary",
    onOpen,
    onToggle,
    onEdit,
    onDelete,
    className,
  } = props;
  const { t } = useTranslation();

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border border-subtle bg-layer-1 transition-all duration-150",
        "hover:border-strong hover:shadow-raised-100",
        isActive && "automation-card-glow-active border-accent-subtle/40",
        className
      )}
    >
      <span
        className={cn(
          "absolute inset-x-0 top-0 h-0.5",
          isActive ? accentBarClass : "bg-subtle"
        )}
        aria-hidden
      />

      <button
        type="button"
        className="flex flex-1 flex-col p-4 pb-3 text-left transition-colors group-hover:bg-layer-1-hover/40"
        onClick={onOpen}
      >
        <div className="flex items-start justify-between gap-2">
          {icon}
          {!badges && (
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-10 font-semibold uppercase tracking-wide",
                isActive ? "bg-success-subtle text-success-primary" : "bg-layer-2 text-tertiary"
              )}
            >
              {isActive
                ? t("boards.settings.automation.rules_list.status_active")
                : t("boards.settings.automation.rules_list.status_inactive")}
            </span>
          )}
        </div>

        <h3 className="mt-3 line-clamp-2 text-14 font-semibold leading-snug text-primary">{title}</h3>

        {description && (
          <div className="mt-1 line-clamp-2 text-13 leading-relaxed text-tertiary">{description}</div>
        )}

        {visual}

        {badges && <div className="mt-3 flex flex-wrap gap-1.5">{badges}</div>}

        {meta}
      </button>

      <div
        className="flex items-center gap-1.5 border-t border-subtle bg-surface-1/70 px-3 py-2"
        onClick={(e) => e.stopPropagation()}
      >
        <label className="mr-auto flex cursor-pointer items-center gap-2 rounded-md px-1 py-0.5 text-11 text-secondary">
          <Switch value={isActive} onChange={onToggle} size="sm" />
          <span className="hidden sm:inline">{t("boards.settings.automation.enabled")}</span>
        </label>
        <Button variant="secondary" size="sm" onClick={onEdit} prependIcon={<Pencil />}>
          {t("edit")}
        </Button>
        <Button variant="error-outline" size="sm" onClick={onDelete} prependIcon={<Trash2 />}>
          {t("delete")}
        </Button>
      </div>
    </article>
  );
}
