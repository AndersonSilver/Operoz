import { useState } from "react";
import { observer } from "mobx-react";
import { CircleDashed } from "lucide-react";
import { ALL_ISSUES } from "@operoz/constants";
import { ChevronRightIcon } from "@operoz/propel/icons";
import type { IGroupByColumn, TIssue, TIssueServiceType, TSubIssueOperations } from "@operoz/types";
import { EIssuesStoreType } from "@operoz/types";
import { Collapsible } from "@operoz/ui";
import { cn } from "@operoz/utils";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { SubIssuesListItem } from "./list-item";
import { SubIssuesTableHeader } from "./sub-issues-table-header";

interface TSubIssuesListGroupProps {
  workItemIds: string[];
  projectId: string;
  workspaceSlug: string;
  group: IGroupByColumn;
  serviceType: TIssueServiceType;
  canEdit: boolean;
  parentIssueId: string;
  rootIssueId: string;
  handleIssueCrudState: (
    key: "create" | "existing" | "update" | "delete",
    issueId: string,
    issue?: TIssue | null
  ) => void;
  subIssueOperations: TSubIssueOperations;
  storeType?: EIssuesStoreType;
  spacingLeft?: number;
}

export const SubIssuesListGroup = observer(function SubIssuesListGroup(props: TSubIssuesListGroupProps) {
  const {
    group,
    serviceType,
    canEdit,
    parentIssueId,
    rootIssueId,
    projectId,
    workspaceSlug,
    handleIssueCrudState,
    subIssueOperations,
    workItemIds,
    storeType = EIssuesStoreType.PROJECT,
    spacingLeft = 0,
  } = props;

  const isAllIssues = group.id === ALL_ISSUES;

  const {
    subIssues: {
      filters: { getSubIssueFilters },
    },
  } = useIssueDetail(serviceType);
  const displayProperties = getSubIssueFilters(rootIssueId)?.displayProperties ?? {};

  // states
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(true);

  if (!workItemIds.length) return null;

  return (
    <>
      <Collapsible
        isOpen={isCollapsibleOpen}
        onToggle={() => setIsCollapsibleOpen(!isCollapsibleOpen)}
        title={
          !isAllIssues && (
            <div className="flex items-center gap-2 p-3">
              <ChevronRightIcon
                className={cn("size-3.5 text-placeholder transition-all", {
                  "rotate-90": isCollapsibleOpen,
                })}
                strokeWidth={2.5}
              />
              <div className="grid flex-shrink-0 place-items-center overflow-hidden">
                {group.icon ?? <CircleDashed className="size-3.5" strokeWidth={2} />}
              </div>
              <span className="text-13 font-medium text-primary">{group.name}</span>
              <span className="text-13 text-placeholder">{workItemIds.length}</span>
            </div>
          )
        }
        buttonClassName={cn("hidden", !isAllIssues && "block")}
      >
        <div className="overflow-hidden rounded-md border border-subtle bg-layer-1">
          {isAllIssues && <SubIssuesTableHeader displayProperties={displayProperties} spacingLeft={spacingLeft} />}
          {workItemIds?.map((workItemId) => (
            <SubIssuesListItem
              key={workItemId}
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              parentIssueId={parentIssueId}
              rootIssueId={rootIssueId}
              issueId={workItemId}
              canEdit={canEdit}
              handleIssueCrudState={handleIssueCrudState}
              subIssueOperations={subIssueOperations}
              issueServiceType={serviceType}
              spacingLeft={spacingLeft}
              storeType={storeType}
            />
          ))}
        </div>
      </Collapsible>
    </>
  );
});
