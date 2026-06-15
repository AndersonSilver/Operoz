import { useMemo, useState } from "react";
import { Check, Layers, Search, X } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { IconButton } from "@operis/propel/icon-button";
import { Tooltip } from "@operis/propel/tooltip";
import { CustomMenu } from "@operis/ui";
import { cn } from "@operis/utils";
import type { Client360BoardOption } from "@/components/board/client-360/client-360-board-filter";

type Props = {
  boards: Client360BoardOption[];
  selectedBoardIds: string[];
  onToggleBoard: (boardId: string) => void;
  onClear: () => void;
  className?: string;
};

export function Client360BoardFilterMenu({ boards, selectedBoardIds, onToggleBoard, onClear, className }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const label = t("boards.client_360.board_filter_label");
  const hasSelection = selectedBoardIds.length > 0;

  const filteredBoards = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return boards;
    return boards.filter((board) => board.name.toLowerCase().includes(q) || board.slug.toLowerCase().includes(q));
  }, [boards, query]);

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
              icon={Layers}
              aria-label={label}
              className={cn("shrink-0 rounded-sm", hasSelection && "text-accent-primary")}
            />
          </span>
        </Tooltip>
      }
    >
      <div className="w-64 border-b border-subtle p-2">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-tertiary"
            strokeWidth={1.75}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("boards.client_360.board_filter_search")}
            className="h-8 w-full rounded-sm border border-subtle bg-layer-2 py-1.5 pr-2 pl-7 text-12 text-primary placeholder:text-tertiary focus:border-strong focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      {hasSelection ? (
        <CustomMenu.MenuItem className="flex items-center gap-2 text-12 text-tertiary" onClick={onClear}>
          <X className="size-3.5 shrink-0" strokeWidth={1.75} />
          {t("boards.client_360.board_filter_clear")}
        </CustomMenu.MenuItem>
      ) : null}

      {filteredBoards.length === 0 ? (
        <div className="px-3 py-2 text-12 text-tertiary">{t("boards.client_360.board_filter_empty")}</div>
      ) : (
        filteredBoards.map((board) => {
          const isSelected = selectedBoardIds.includes(board.id);
          return (
            <CustomMenu.MenuItem
              key={board.id}
              className="flex items-center gap-2"
              onClick={() => onToggleBoard(board.id)}
            >
              <span
                className={cn(
                  "grid size-4 shrink-0 place-items-center rounded-sm border",
                  isSelected ? "border-accent-primary bg-accent-primary text-on-color" : "border-subtle bg-layer-2"
                )}
              >
                {isSelected ? <Check className="size-3" strokeWidth={2.5} /> : null}
              </span>
              <span className={cn("min-w-0 flex-1 truncate", isSelected && "font-medium text-primary")}>
                {board.name}
              </span>
            </CustomMenu.MenuItem>
          );
        })
      )}
    </CustomMenu>
  );
}

type ChipsProps = {
  boards: Client360BoardOption[];
  onRemove: (boardId: string) => void;
  onClear: () => void;
  className?: string;
};

export function Client360BoardFilterChips({ boards, onRemove, onClear, className }: ChipsProps) {
  const { t } = useTranslation();
  if (boards.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2 px-4 py-2.5", className)}>
      <span className="text-11 font-medium tracking-wide text-tertiary uppercase">
        {t("boards.client_360.board_filter_active")}
      </span>
      {boards.map((board) => (
        <button
          key={board.id}
          type="button"
          onClick={() => onRemove(board.id)}
          className="inline-flex max-w-[220px] items-center gap-1 rounded-full border border-accent-subtle bg-accent-subtle/40 px-2.5 py-1 text-11 font-medium text-accent-primary transition-colors hover:bg-accent-subtle/60"
        >
          <span className="truncate">{board.name}</span>
          <X className="size-3 shrink-0" strokeWidth={2} />
        </button>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="text-11 font-medium text-tertiary transition-colors hover:text-secondary"
      >
        {t("boards.client_360.board_filter_clear")}
      </button>
    </div>
  );
}
