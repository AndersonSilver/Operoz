import { observer } from "mobx-react";
import { Columns3 } from "lucide-react";
import { useParams } from "next/navigation";
import { EIssueFilterType, ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { EIssueLayoutTypes, EIssuesStoreType } from "@operis/types";
import type { IIssueDisplayProperties } from "@operis/types";
import { FilterDisplayProperties } from "@/components/issues/issue-layouts/filters/header/display-filters/display-properties";
import { resolveBoardListDisplayProperties } from "@/components/issues/issue-layouts/list-display-properties";
import { FiltersDropdown } from "@/components/issues/issue-layouts/filters/header/helpers/dropdown";
import { useIssues } from "@/hooks/store/use-issues";
import type { IBoardIssuesFilter } from "@/store/issue/board/filter.store";

export const ListColumnsMenu = observer(function ListColumnsMenu() {
  const { t } = useTranslation();
  const { workspaceSlug, boardSlug } = useParams();
  const {
    issuesFilter: { filters, updateFilters },
  } = useIssues(EIssuesStoreType.BOARD);

  const viewId = boardSlug?.toString();
  const issueFilters = viewId ? filters?.[viewId] : undefined;
  const displayProperties = resolveBoardListDisplayProperties(issueFilters?.displayProperties);
  const layout = issueFilters?.displayFilters?.layout ?? EIssueLayoutTypes.LIST;

  const displayPropertiesToRender =
    ISSUE_DISPLAY_FILTERS_BY_PAGE.board_backlog.layoutOptions[layout]?.display_properties ??
    ISSUE_DISPLAY_FILTERS_BY_PAGE.board_backlog.layoutOptions.list.display_properties;

  const handleDisplayPropertiesUpdate = (updated: Partial<IIssueDisplayProperties>) => {
    if (!workspaceSlug || !viewId) return;

    (updateFilters as IBoardIssuesFilter["updateFilters"])(
      workspaceSlug.toString(),
      undefined,
      EIssueFilterType.DISPLAY_PROPERTIES,
      updated,
      viewId
    );
  };

  if (!workspaceSlug || !viewId || !displayPropertiesToRender?.length) return null;

  return (
    <FiltersDropdown
      placement="bottom-end"
      menuButton={
        <Button variant="secondary" size="sm" className="h-7 shrink-0 gap-1 px-2 text-11">
          <Columns3 className="size-3.5" />
          <span className="hidden md:inline">{t("issue.display.properties.label")}</span>
        </Button>
      }
    >
      <FilterDisplayProperties
        displayProperties={displayProperties}
        displayPropertiesToRender={displayPropertiesToRender.filter((key) => key !== "key")}
        handleUpdate={handleDisplayPropertiesUpdate}
        cycleViewDisabled={false}
        moduleViewDisabled={false}
        workspaceSlug={workspaceSlug?.toString()}
        boardSlug={boardSlug?.toString()}
      />
    </FiltersDropdown>
  );
});
