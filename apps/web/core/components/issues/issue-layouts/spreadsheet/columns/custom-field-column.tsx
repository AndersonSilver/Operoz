import { observer } from "mobx-react";
import type { IProjectCustomFieldLite, TCustomFieldValue, TIssue } from "@operoz/types";
import {
  BoardCustomFieldLayoutCell,
  readIssueLayoutCustomValue,
} from "@/components/issues/issue-layouts/custom-fields/board-custom-field-layout-cell";

type Props = {
  field: IProjectCustomFieldLite;
  issue: TIssue;
  workspaceSlug: string;
  disabled: boolean;
  onCustomFieldSaved: (fieldId: string, value: TCustomFieldValue) => void;
  onClose: () => void;
};

export const SpreadsheetCustomFieldColumn = observer(function SpreadsheetCustomFieldColumn(props: Props) {
  const { field, issue, workspaceSlug, disabled, onCustomFieldSaved, onClose } = props;

  return (
    <div className="h-11 border-b-[0.5px] border-subtle" onBlur={onClose}>
      <BoardCustomFieldLayoutCell
        field={field}
        issue={issue}
        workspaceSlug={workspaceSlug}
        value={readIssueLayoutCustomValue(issue, field.id)}
        isReadOnly={disabled}
        compact
        onValueSaved={onCustomFieldSaved}
      />
    </div>
  );
});
