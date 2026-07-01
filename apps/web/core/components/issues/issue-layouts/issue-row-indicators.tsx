import type { MouseEvent } from "react";
import { ListTree } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Tooltip } from "@operoz/propel/tooltip";
import { cn } from "@operoz/utils";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";

type SubIssuesIndicatorProps = {
  count: number;
  isEpic?: boolean;
  isMobile?: boolean;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
};

export function IssueSubIssuesIndicator(props: SubIssuesIndicatorProps) {
  const { count, isEpic = false, isMobile, onClick, className } = props;
  const { t } = useTranslation();

  if (isEpic || count <= 0) return null;

  return (
    <Tooltip
      tooltipContent={`${count} ${t("common.sub_work_items").toLowerCase()}`}
      isMobile={isMobile}
      renderByDefault={false}
    >
      <button
        type="button"
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-xs text-tertiary hover:bg-layer-transparent-hover hover:text-secondary",
          className
        )}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onClick?.(e);
        }}
        aria-label={t("common.sub_work_items")}
      >
        <ListTree size={14} strokeWidth={1.75} />
      </button>
    </Tooltip>
  );
}

type AssigneeIndicatorProps = {
  assigneeIds?: string[] | null;
  className?: string;
};

export function IssueAssigneeIndicator(props: AssigneeIndicatorProps) {
  const { assigneeIds, className } = props;

  if (!assigneeIds?.length) return null;

  return (
    <div
      className={cn("flex shrink-0 items-center", className)}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <ButtonAvatars showTooltip userIds={assigneeIds.length === 1 ? assigneeIds[0] : assigneeIds} size="sm" />
    </div>
  );
}
