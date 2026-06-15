import { observer } from "mobx-react";
import { useTranslation } from "@operis/i18n";
// plane imports
import type { IGanttBlock } from "@operis/types";
import { Row } from "@operis/ui";
import { cn } from "@operis/utils";
// components
import { MultipleSelectEntityAction } from "@/components/core/multiple-select";
import { IssueGanttSidebarBlock } from "@/components/issues/issue-layouts/gantt/blocks";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import type { TSelectionHelper } from "@/hooks/use-multiple-select";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
// local imports
import { getGanttScheduleDisplay } from "@/components/gantt-chart/helpers/schedule-display";
import { BLOCK_HEIGHT, GANTT_CHECKBOX_GUTTER_PX, GANTT_SELECT_GROUP } from "../../constants";

type Props = {
  block: IGanttBlock;
  enableSelection: boolean;
  isDragging: boolean;
  selectionHelpers?: TSelectionHelper;
  isEpic?: boolean;
  showDurationColumn?: boolean;
};

export const IssuesSidebarBlock = observer(function IssuesSidebarBlock(props: Props) {
  const { block, enableSelection, isDragging, selectionHelpers, isEpic = false, showDurationColumn = false } = props;
  const { t } = useTranslation();
  // store hooks
  const { updateActiveBlockId, isBlockActive } = useTimeLineChartStore();
  const { getIsIssuePeeked } = useIssueDetail();

  const schedule = showDurationColumn ? getGanttScheduleDisplay(block, t) : null;

  if (!block?.data) return null;

  const isIssueSelected = selectionHelpers?.getIsEntitySelected(block.id);
  const isIssueFocused = selectionHelpers?.getIsEntityActive(block.id);
  const isBlockHoveredOn = isBlockActive(block.id);

  const scheduleHint = schedule?.title ?? `${t("issue.add.start_date")} · ${t("issue.add.due_date")}`;

  return (
    <div
      className={cn("group/list-block", {
        "rounded-sm bg-layer-1": isDragging,
        "rounded-l-sm border border-r-0 border-accent-strong": getIsIssuePeeked(block.data.id),
        "border border-r-0 border-strong-1": isIssueFocused,
      })}
      onMouseEnter={() => updateActiveBlockId(block.id)}
      onMouseLeave={() => updateActiveBlockId(null)}
    >
      <Row
        className={cn(
          "group flex w-full items-center gap-2 bg-layer-transparent pr-4 hover:bg-layer-transparent-hover",
          {
            "pl-8": enableSelection,
            "bg-layer-transparent-hover": isBlockHoveredOn,
            "bg-accent-primary/5 hover:bg-accent-primary/10": isIssueSelected,
            "bg-accent-primary/10": isIssueSelected && isBlockHoveredOn,
          }
        )}
        style={{
          height: `${BLOCK_HEIGHT}px`,
        }}
      >
        {enableSelection && selectionHelpers && (
          <div
            className="absolute left-2 flex flex-shrink-0 items-center"
            style={{ width: `${GANTT_CHECKBOX_GUTTER_PX - 8}px` }}
          >
            <MultipleSelectEntityAction
              className="size-3.5 !outline-none"
              groupId={GANTT_SELECT_GROUP}
              id={block.id}
              selectionHelpers={selectionHelpers}
            />
          </div>
        )}
        <div className="flex h-full min-w-0 flex-grow items-center justify-between gap-2">
          <div className="min-w-0 flex-grow">
            <IssueGanttSidebarBlock issueId={block.data.id} isEpic={isEpic} />
          </div>
          {showDurationColumn && schedule ? (
            <div className="flex-shrink-0 text-13 text-secondary" title={scheduleHint}>
              <span className={schedule.isPlaceholder ? "text-tertiary" : undefined}>{schedule.label}</span>
            </div>
          ) : null}
        </div>
      </Row>
    </div>
  );
});
