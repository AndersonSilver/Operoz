import type { LucideIcon } from "lucide-react";

import { Check, Grid3x3, LayoutGrid, List, Table2 } from "lucide-react";

import { useTranslation } from "@operoz/i18n";

import { IconButton } from "@operoz/propel/icon-button";

import { Tooltip } from "@operoz/propel/tooltip";

import { CustomMenu } from "@operoz/ui";

import { cn } from "@operoz/utils";

export type Client360ViewMode = "table" | "grid" | "list" | "matrix";

const VIEW_STORAGE_KEY = "client360_clients_view";

export const CLIENT_360_VIEW_OPTIONS: {
  id: Client360ViewMode;

  icon: LucideIcon;

  labelKey: string;
}[] = [
  { id: "table", icon: Table2, labelKey: "boards.client_360.view_table" },

  { id: "grid", icon: LayoutGrid, labelKey: "boards.client_360.view_grid" },

  { id: "list", icon: List, labelKey: "boards.client_360.view_list" },

  { id: "matrix", icon: Grid3x3, labelKey: "boards.client_360.view_matrix" },
];

export function loadClient360ViewMode(
  boardSlug: string,
  options?: { wideDefault?: Client360ViewMode; wideMinPx?: number }
): Client360ViewMode {
  if (typeof window === "undefined") return "table";

  try {
    const stored = localStorage.getItem(`${VIEW_STORAGE_KEY}_${boardSlug}`);

    if (stored === "table" || stored === "grid" || stored === "list" || stored === "matrix") return stored;
  } catch {
    /* ignore */
  }

  const wideMinPx = options?.wideMinPx ?? 1024;

  if (options?.wideDefault && window.matchMedia(`(min-width: ${wideMinPx}px)`).matches) {
    return options.wideDefault;
  }

  return "table";
}

export function saveClient360ViewMode(boardSlug: string, mode: Client360ViewMode) {
  try {
    localStorage.setItem(`${VIEW_STORAGE_KEY}_${boardSlug}`, mode);
  } catch {
    /* ignore */
  }
}

type Props = {
  view: Client360ViewMode;

  onChange: (view: Client360ViewMode) => void;

  className?: string;
};

export function Client360ViewToggle({ view, onChange, className }: Props) {
  const { t } = useTranslation();

  const activeOption = CLIENT_360_VIEW_OPTIONS.find((o) => o.id === view) ?? CLIENT_360_VIEW_OPTIONS[0];

  const viewLabel = t("boards.client_360.view_label");

  const activeViewLabel = t(activeOption.labelKey);

  return (
    <CustomMenu
      className={className}
      placement="bottom-end"
      closeOnSelect
      customButton={
        <Tooltip tooltipContent={viewLabel}>
          <span className="inline-flex">
            <IconButton
              variant="secondary"
              size="xl"
              icon={activeOption.icon}
              aria-label={`${viewLabel}: ${activeViewLabel}`}
              className="shrink-0 rounded-sm"
            />
          </span>
        </Tooltip>
      }
    >
      {CLIENT_360_VIEW_OPTIONS.map(({ id, icon: Icon, labelKey }) => {
        const isActive = view === id;

        return (
          <CustomMenu.MenuItem key={id} className="flex items-center gap-2" onClick={() => onChange(id)}>
            <Icon className="size-3.5 shrink-0 text-tertiary" strokeWidth={1.75} />

            <span className={cn("min-w-0 flex-1 truncate", isActive && "font-medium text-primary")}>{t(labelKey)}</span>

            {isActive ? <Check className="size-3.5 shrink-0 text-accent-primary" strokeWidth={2.5} /> : null}
          </CustomMenu.MenuItem>
        );
      })}
    </CustomMenu>
  );
}
