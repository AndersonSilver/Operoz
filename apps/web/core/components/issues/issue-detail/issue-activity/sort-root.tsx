import { memo } from "react";
import { ArrowUpWideNarrow, ArrowDownWideNarrow } from "lucide-react";
// plane package imports
import { E_SORT_ORDER } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import { Tooltip } from "@operoz/propel/tooltip";
import { IconButton } from "@operoz/propel/icon-button";

export type TActivitySortRoot = {
  sortOrder: E_SORT_ORDER;
  toggleSort: () => void;
};
export const ActivitySortRoot = memo(function ActivitySortRoot(props: TActivitySortRoot) {
  const { sortOrder, toggleSort } = props;
  const { t } = useTranslation();
  const SortIcon = sortOrder === E_SORT_ORDER.ASC ? ArrowUpWideNarrow : ArrowDownWideNarrow;

  return (
    <Tooltip
      tooltipContent={
        sortOrder === E_SORT_ORDER.ASC ? t("issue.activity.sort_oldest_first") : t("issue.activity.sort_newest_first")
      }
    >
      <IconButton variant="tertiary" size="sm" icon={SortIcon} onClick={toggleSort} />
    </Tooltip>
  );
});

ActivitySortRoot.displayName = "ActivitySortRoot";
