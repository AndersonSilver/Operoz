import React from "react";
// types
import { CycleGroupIcon, ChevronDownIcon } from "@operis/propel/icons";
import type { TCycleGroups } from "@operis/types";
// icons
import { Row } from "@operis/ui";
// helpers
import { cn } from "@operis/utils";

type Props = {
  type: TCycleGroups;
  title: string;
  count?: number;
  showCount?: boolean;
  isExpanded?: boolean;
};

export function CycleListGroupHeader(props: Props) {
  const { type, title, count, showCount = false, isExpanded = false } = props;
  return (
    <Row className="flex items-center justify-between px-3 py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="grid size-7 shrink-0 place-items-center rounded-md border border-subtle/50 bg-layer-2/80">
          <CycleGroupIcon cycleGroup={type} className="size-4" />
        </div>

        <div className="relative flex min-w-0 flex-row items-center gap-2 overflow-hidden">
          <div className="truncate text-13 font-semibold text-primary">{title}</div>
          {showCount ? (
            <span className="shrink-0 rounded-md bg-layer-2 px-1.5 py-0.5 text-11 font-medium tabular-nums text-tertiary">
              {count ?? 0}
            </span>
          ) : null}
        </div>
      </div>
      <ChevronDownIcon
        className={cn("size-4 shrink-0 text-tertiary transition-transform", {
          "rotate-180": isExpanded,
        })}
      />
    </Row>
  );
}
