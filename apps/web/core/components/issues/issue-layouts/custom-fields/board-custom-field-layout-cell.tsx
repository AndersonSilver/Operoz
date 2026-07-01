"use client";

import type { SyntheticEvent } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@operoz/i18n";
import type { IProjectCustomFieldLite, TCustomFieldValue, TIssue } from "@operoz/types";
import { cn, renderFormattedPayloadDate } from "@operoz/utils";
import { DateDropdown } from "@/components/dropdowns/date";
import { BoardCustomFieldService } from "@/services/board/board-custom-field.service";
import { getIssueCustomFieldValue } from "@/hooks/use-board-layout-custom-fields";

type Props = {
  field: IProjectCustomFieldLite;
  issue: TIssue;
  workspaceSlug: string;
  value: TCustomFieldValue | undefined;
  isReadOnly: boolean;
  compact?: boolean;
  onValueSaved?: (fieldId: string, value: TCustomFieldValue) => void;
};

const service = new BoardCustomFieldService();

export const BoardCustomFieldLayoutCell = observer(function BoardCustomFieldLayoutCell(props: Props) {
  const { field, issue, workspaceSlug, value, isReadOnly, compact = false, onValueSaved } = props;
  const { t } = useTranslation();

  const handleEventPropagation = (e: SyntheticEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const persist = async (next: TCustomFieldValue) => {
    await service.saveIssueCustomFieldValues(workspaceSlug, issue.id, [{ custom_field_id: field.id, value: next }]);
    onValueSaved?.(field.id, next);
  };

  if (field.field_type === "date" || field.field_type === "datetime") {
    const dateValue = typeof value === "string" ? value : null;
    const formatted = dateValue ? renderFormattedPayloadDate(dateValue) : null;

    if (isReadOnly) {
      return (
        <span className={cn("text-caption-sm-regular text-primary", compact && "truncate")}>{formatted ?? "—"}</span>
      );
    }

    return (
      <div className="h-5 min-w-0" onFocus={handleEventPropagation} onClick={handleEventPropagation}>
        <DateDropdown
          value={dateValue}
          onChange={(next) => {
            const payload: TCustomFieldValue = next ? (renderFormattedPayloadDate(next) ?? null) : null;
            void persist(payload);
          }}
          placeholder={field.name}
          buttonVariant={dateValue ? "border-with-text" : "border-without-text"}
          disabled={isReadOnly}
          showTooltip
          labelClassName="text-caption-sm-regular"
        />
      </div>
    );
  }

  return <span className="text-caption-sm-regular text-tertiary">—</span>;
});

export function readIssueLayoutCustomValue(issue: TIssue, fieldId: string): TCustomFieldValue | undefined {
  return getIssueCustomFieldValue(issue.custom_field_values, fieldId);
}
