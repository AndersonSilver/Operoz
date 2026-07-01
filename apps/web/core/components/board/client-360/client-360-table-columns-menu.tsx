import { ArrowDown, ArrowUp, Check, Columns3, RotateCcw } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { IconButton } from "@operoz/propel/icon-button";
import { Tooltip } from "@operoz/propel/tooltip";
import { CustomMenu } from "@operoz/ui";
import { cn } from "@operoz/utils";
import {
  client360TableColumnLabelKey,
  type Client360TableColumnConfig,
  type Client360TableColumnId,
} from "@/components/board/client-360/client-360-table-columns";

type Props = {
  columns: Client360TableColumnConfig[];
  hasCustomColumns: boolean;
  onToggleColumn: (columnId: Client360TableColumnId) => void;
  onMoveColumn: (columnId: Client360TableColumnId, direction: "up" | "down") => void;
  onResetColumns: () => void;
  className?: string;
};

export function Client360TableColumnsMenu({
  columns,
  hasCustomColumns,
  onToggleColumn,
  onMoveColumn,
  onResetColumns,
  className,
}: Props) {
  const { t } = useTranslation();
  const label = t("boards.client_360.columns_menu_label");

  return (
    <CustomMenu
      className={className}
      placement="bottom-end"
      customButton={
        <Tooltip tooltipContent={label}>
          <span className="inline-flex">
            <IconButton
              variant="secondary"
              size="xl"
              icon={Columns3}
              aria-label={label}
              className={cn("shrink-0 rounded-sm", hasCustomColumns && "text-accent-primary")}
            />
          </span>
        </Tooltip>
      }
    >
      <div className="border-b border-subtle px-3 py-2 text-11 font-medium tracking-wide text-tertiary uppercase">
        {label}
      </div>
      {columns.map((column, index) => {
        const isFirst = index === 0;
        const isLast = index === columns.length - 1;
        return (
          <div
            key={column.id}
            className="flex items-center gap-1 border-b border-subtle/60 px-2 py-1.5 last:border-b-0"
          >
            <button
              type="button"
              onClick={() => onToggleColumn(column.id)}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-sm px-1 py-1 text-left transition-colors hover:bg-layer-2"
            >
              <span
                className={cn(
                  "grid size-4 shrink-0 place-items-center rounded-sm border",
                  column.visible ? "border-accent-primary bg-accent-primary text-on-color" : "border-subtle bg-layer-2"
                )}
              >
                {column.visible ? <Check className="size-3" strokeWidth={2.5} /> : null}
              </span>
              <span className={cn("truncate text-13", column.visible ? "text-primary" : "text-tertiary")}>
                {t(client360TableColumnLabelKey(column.id))}
              </span>
            </button>
            <div className="flex shrink-0 items-center">
              <button
                type="button"
                disabled={isFirst}
                onClick={() => onMoveColumn(column.id, "up")}
                className="grid size-6 place-items-center rounded-xs text-tertiary transition-colors hover:bg-layer-2 hover:text-secondary disabled:opacity-30"
                aria-label={t("boards.client_360.columns_move_up")}
              >
                <ArrowUp className="size-3.5" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                disabled={isLast}
                onClick={() => onMoveColumn(column.id, "down")}
                className="grid size-6 place-items-center rounded-xs text-tertiary transition-colors hover:bg-layer-2 hover:text-secondary disabled:opacity-30"
                aria-label={t("boards.client_360.columns_move_down")}
              >
                <ArrowDown className="size-3.5" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        );
      })}
      <CustomMenu.MenuItem className="flex items-center gap-2" onClick={onResetColumns}>
        <RotateCcw className="size-3.5 shrink-0 text-tertiary" strokeWidth={1.75} />
        <span className="min-w-0 flex-1 truncate">{t("boards.client_360.columns_reset")}</span>
      </CustomMenu.MenuItem>
    </CustomMenu>
  );
}
