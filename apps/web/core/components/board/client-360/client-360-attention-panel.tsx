import { useMemo } from "react";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import type { TClient360Client } from "@operis/types";
import { cn } from "@operis/utils";
import {
  buildClient360AttentionItems,
  client360AttentionFilterKeys,
  type Client360AttentionItem,
  type Client360AttentionReason,
} from "@/components/board/client-360/client-360-attention";
import type { Client360FilterKey } from "@/components/board/client-360/client-360-client-filters";
import { CLIENT_360_FILTER_OPTIONS } from "@/components/board/client-360/client-360-client-filters";
import { CLIENT_360_TONE } from "@/components/board/client-360/client-360-tokens";
import { BoardHubNavLink } from "@/components/board/board-hub-nav-link";

type Props = {
  clients: TClient360Client[];
  basePath: string;
  onFilterChange?: (filter: Client360FilterKey) => void;
  showBoard?: boolean;
  /** Inside bento tile — omits outer section chrome. */
  embedded?: boolean;
  /** Quick filters rendered in the bento header instead of the body. */
  filtersInHeader?: boolean;
};

function attentionReasonKey(reason: Client360AttentionReason): string {
  switch (reason) {
    case "critical":
      return "boards.client_360.attention_reason_critical";
    case "score_alert":
      return "boards.client_360.attention_reason_score_alert";
    case "report_missing":
      return "boards.client_360.attention_reason_report_missing";
    case "overdue":
      return "boards.client_360.attention_reason_overdue";
    case "support_open":
      return "boards.client_360.attention_reason_support";
  }
}

export function Client360AttentionQuickFilters({
  clients,
  onFilterChange,
  className,
}: {
  clients: TClient360Client[];
  onFilterChange: (filter: Client360FilterKey) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const items = useMemo(() => buildClient360AttentionItems(clients), [clients]);
  const quickFilters = useMemo(() => client360AttentionFilterKeys(items), [items]);

  if (quickFilters.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center justify-end gap-1.5", className)}>
      {quickFilters.map((filterKey) => {
        const option = CLIENT_360_FILTER_OPTIONS.find((o) => o.key === filterKey);
        if (!option) return null;
        return (
          <button
            key={filterKey}
            type="button"
            onClick={() => onFilterChange(filterKey)}
            className="rounded-md border border-subtle bg-layer-2 px-2 py-1 text-11 font-medium text-secondary transition-colors hover:border-strong hover:text-primary"
          >
            {t(option.labelKey)}
          </button>
        );
      })}
    </div>
  );
}

function AttentionRow({
  item,
  basePath,
  showBoard,
  compact,
}: {
  item: Client360AttentionItem;
  basePath: string;
  showBoard?: boolean;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const tone = CLIENT_360_TONE[item.tone];
  const reasonLabel = t(attentionReasonKey(item.reason), {
    count: item.metric ?? 0,
    threshold: item.metric ?? 0,
  });

  if (compact) {
    return (
      <BoardHubNavLink
        to={`${basePath}/${item.projectId}`}
        className="group flex h-full w-full min-w-0 items-center gap-3 rounded-lg border border-subtle/80 bg-layer-2/30 px-3 py-2.5 transition-colors hover:border-strong hover:bg-layer-2"
      >
        <span className={cn("size-2 shrink-0 rounded-full", tone.dot)} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate text-13 leading-snug font-medium text-primary">{item.clientName}</p>
          {showBoard ? (
            <p className="mt-0.5 min-h-[1rem] truncate text-11 leading-4 text-tertiary">{item.boardName ?? "\u00A0"}</p>
          ) : null}
        </div>
        <span className="inline-flex max-w-[9rem] shrink-0 items-center rounded-md border border-subtle bg-layer-1 px-2 py-0.5 text-10 leading-snug font-medium text-secondary">
          <span className="truncate">{reasonLabel}</span>
        </span>
        <ChevronRight
          className="size-3.5 shrink-0 text-tertiary opacity-60 transition-opacity group-hover:opacity-100"
          strokeWidth={1.75}
        />
      </BoardHubNavLink>
    );
  }

  return (
    <BoardHubNavLink
      to={`${basePath}/${item.projectId}`}
      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-layer-2"
    >
      <span className={cn("size-2 shrink-0 rounded-full", tone.dot)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-13 font-medium text-primary">{item.clientName}</p>
        <p className="mt-0.5 truncate text-12 text-tertiary">
          {showBoard && item.boardName ? `${item.boardName} · ` : null}
          {reasonLabel}
        </p>
      </div>
      <ChevronRight
        className="size-4 shrink-0 text-tertiary opacity-0 transition-opacity group-hover:opacity-100"
        strokeWidth={1.75}
      />
    </BoardHubNavLink>
  );
}

export function Client360AttentionPanel({
  clients,
  basePath,
  onFilterChange,
  showBoard,
  embedded = false,
  filtersInHeader = false,
}: Props) {
  const { t } = useTranslation();

  const items = useMemo(() => buildClient360AttentionItems(clients), [clients]);
  const quickFilters = useMemo(() => client360AttentionFilterKeys(items), [items]);

  const filterButtons =
    !filtersInHeader && onFilterChange && quickFilters.length > 0 ? (
      <Client360AttentionQuickFilters clients={clients} onFilterChange={onFilterChange} />
    ) : null;

  const useCompactGrid = embedded && items.length > 0;

  const listBody =
    items.length > 0 ? (
      <ul
        className={cn(
          useCompactGrid
            ? "grid grid-cols-1 gap-2 md:grid-cols-2 md:items-stretch"
            : cn("divide-y divide-subtle", embedded && "rounded-lg border border-subtle/80")
        )}
      >
        {items.map((item) => (
          <li key={item.projectId} className={useCompactGrid ? "flex min-w-0" : undefined}>
            <AttentionRow item={item} basePath={basePath} showBoard={showBoard} compact={useCompactGrid} />
          </li>
        ))}
      </ul>
    ) : (
      <p
        className={cn(
          "flex items-center gap-2 text-12 text-tertiary",
          embedded ? "rounded-lg border border-subtle/80 bg-layer-2/30 px-3 py-3" : "px-4 py-4"
        )}
      >
        <CheckCircle2 className="size-3.5 shrink-0 text-success-primary" strokeWidth={1.75} />
        {t("boards.client_360.attention_empty")}
      </p>
    );

  if (embedded) {
    return (
      <div className="flex flex-col gap-2">
        {filterButtons ? <div className="flex justify-end">{filterButtons}</div> : null}
        {listBody}
      </div>
    );
  }

  return (
    <div className="border-t border-subtle">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-subtle px-4 py-3">
        <h3 className="text-13 font-semibold text-primary">{t("boards.client_360.attention_title")}</h3>
        {filterButtons}
      </div>
      {listBody}
    </div>
  );
}
