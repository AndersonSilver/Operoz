import { observer } from "mobx-react";
import { useTranslation } from "@operoz/i18n";
import type { IIssueDisplayProperties } from "@operoz/types";
import { WithDisplayPropertiesHOC } from "@/components/issues/issue-layouts/properties/with-display-properties-HOC";
import { SUB_ISSUES_TABLE_GRID } from "./sub-issues-table-layout";

type Props = {
  displayProperties: IIssueDisplayProperties;
  spacingLeft?: number;
};

export const SubIssuesTableHeader = observer(function SubIssuesTableHeader(props: Props) {
  const { displayProperties, spacingLeft = 0 } = props;
  const { t } = useTranslation();

  return (
    <div
      className={`${SUB_ISSUES_TABLE_GRID} border-b border-subtle bg-layer-1 px-3 py-2 text-11 font-medium text-tertiary`}
      style={{ paddingLeft: `${spacingLeft + 12}px` }}
    >
      <span>{t("sub_work_item.table.ticket")}</span>
      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="priority">
        <span className="truncate">{t("sub_work_item.table.priority")}</span>
      </WithDisplayPropertiesHOC>
      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="assignee">
        <span className="truncate">{t("sub_work_item.table.assignee")}</span>
      </WithDisplayPropertiesHOC>
      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="state">
        <span className="truncate">{t("sub_work_item.table.status")}</span>
      </WithDisplayPropertiesHOC>
      <span aria-hidden />
    </div>
  );
});
