import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import type { IIssueDisplayProperties, TCustomFieldValue, TIssue } from "@operis/types";
import {
  BoardCustomFieldLayoutCell,
  readIssueLayoutCustomValue,
} from "@/components/issues/issue-layouts/custom-fields/board-custom-field-layout-cell";
import { useBoardLayoutCustomFields } from "@/hooks/use-board-layout-custom-fields";
import { store } from "@/lib/store-context";

export type TWorkItemLayoutAdditionalProperties = {
  displayProperties: IIssueDisplayProperties;
  issue: TIssue;
  isReadOnly?: boolean;
};

export const WorkItemLayoutAdditionalProperties = observer(function WorkItemLayoutAdditionalProperties(
  props: TWorkItemLayoutAdditionalProperties
) {
  const { displayProperties, issue, isReadOnly = false } = props;
  const { workspaceSlug, boardSlug } = useParams();

  const { visibleFields } = useBoardLayoutCustomFields({
    workspaceSlug: workspaceSlug?.toString() ?? "",
    boardSlug: boardSlug?.toString(),
    displayProperties,
  });

  const handleCustomFieldSaved = useCallback(
    (fieldId: string, value: TCustomFieldValue) => {
      store.issue.issues.updateIssue(issue.id, {
        custom_field_values: { ...(issue.custom_field_values ?? {}), [fieldId]: value },
      });
    },
    [issue]
  );

  if (!visibleFields.length || !workspaceSlug || !boardSlug) return null;

  return (
    <>
      {visibleFields.map((field) => (
        <BoardCustomFieldLayoutCell
          key={field.id}
          field={field}
          issue={issue}
          workspaceSlug={workspaceSlug.toString()}
          value={readIssueLayoutCustomValue(issue, field.id)}
          isReadOnly={isReadOnly}
          onValueSaved={handleCustomFieldSaved}
        />
      ))}
    </>
  );
});
