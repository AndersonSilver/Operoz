import { observer } from "mobx-react";
import { Link as Loader } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { LinkIcon, EditIcon, TrashIcon, CloseIcon, ChevronRightIcon } from "@operoz/propel/icons";
// plane imports
import { Tooltip } from "@operoz/propel/tooltip";
import type { TIssue, TIssueServiceType, TSubIssueOperations } from "@operoz/types";
import { EIssueServiceType, EIssuesStoreType } from "@operoz/types";
import { ControlLink, CustomMenu } from "@operoz/ui";
import { cn, generateWorkItemLink } from "@operoz/utils";
// helpers
import { useSubIssueOperations } from "@/components/issues/issue-detail-widgets/sub-issues/helper";
import { WithDisplayPropertiesHOC } from "@/components/issues/issue-layouts/properties/with-display-properties-HOC";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import useIssuePeekOverviewRedirection from "@/hooks/use-issue-peek-overview-redirection";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { IssueIdentifier, IssueTypeIdentifier } from "@/plane-web/components/issues/issue-details/issue-identifier";
// local components
import { SubIssuesListItemAssigneeCell, SubIssuesListItemPriorityCell, SubIssuesListItemStateCell } from "./properties";
import { SubIssuesListRoot } from "./root";
import { SUB_ISSUES_TABLE_GRID } from "./sub-issues-table-layout";

type Props = {
  workspaceSlug: string;
  projectId: string;
  parentIssueId: string;
  rootIssueId: string;
  spacingLeft: number;
  canEdit: boolean;
  handleIssueCrudState: (
    key: "create" | "existing" | "update" | "delete",
    issueId: string,
    issue?: TIssue | null
  ) => void;
  subIssueOperations: TSubIssueOperations;
  issueId: string;
  issueServiceType?: TIssueServiceType;
  storeType?: EIssuesStoreType;
};

export const SubIssuesListItem = observer(function SubIssuesListItem(props: Props) {
  const {
    workspaceSlug,
    projectId,
    parentIssueId,
    rootIssueId,
    issueId,
    spacingLeft = 0,
    canEdit,
    handleIssueCrudState,
    subIssueOperations,
    issueServiceType = EIssueServiceType.ISSUES,
    storeType = EIssuesStoreType.PROJECT,
  } = props;
  const { t } = useTranslation();
  const {
    issue: { getIssueById },
    subIssues: {
      filters: { getSubIssueFilters },
    },
  } = useIssueDetail(issueServiceType);
  const {
    subIssues: { subIssueHelpersByIssueId, setSubIssueHelpers },
  } = useIssueDetail();
  const { fetchSubIssues } = useSubIssueOperations(EIssueServiceType.ISSUES);
  const { toggleCreateIssueModal, toggleDeleteIssueModal } = useIssueDetail(issueServiceType);
  const project = useProject();
  const { handleRedirection } = useIssuePeekOverviewRedirection();
  const { isMobile } = usePlatformOS();
  const issue = getIssueById(issueId);

  const projectDetail = (issue && issue.project_id && project.getProjectById(issue.project_id)) || undefined;
  const subIssueHelpers = subIssueHelpersByIssueId(parentIssueId);
  const subIssueCount = issue?.sub_issues_count ?? 0;
  const subIssueFilters = getSubIssueFilters(rootIssueId);
  const displayProperties = subIssueFilters?.displayProperties ?? {};

  const handleIssuePeekOverview = (issue: TIssue) => handleRedirection(workspaceSlug, issue, isMobile);

  if (!issue) return <></>;

  const isCurrentIssueRoot = issueId === rootIssueId;

  const workItemLink = generateWorkItemLink({
    workspaceSlug,
    projectId: issue?.project_id,
    issueId: issue?.id,
    projectIdentifier: projectDetail?.identifier,
    sequenceId: issue?.sequence_id,
  });

  const cellProps = {
    workspaceSlug,
    parentIssueId,
    issueId,
    canEdit,
    updateSubIssue: subIssueOperations.updateSubIssue,
    displayProperties,
    issue,
  };

  return (
    <div key={issueId}>
      <ControlLink
        id={`issue-${issue.id}`}
        href={workItemLink}
        onClick={() => handleIssuePeekOverview(issue)}
        className="block w-full cursor-pointer"
      >
        <div
          className={cn(
            SUB_ISSUES_TABLE_GRID,
            "group border-b border-subtle px-3 py-2 transition-colors last:border-b-0 hover:bg-layer-transparent-hover"
          )}
          style={{ paddingLeft: `${spacingLeft + 12}px` }}
        >
          <div className="flex min-w-0 items-center gap-1.5">
            <div className="flex size-4 flex-shrink-0 items-center justify-center">
              {subIssueCount > 0 && !isCurrentIssueRoot && (
                <>
                  {subIssueHelpers.preview_loader.includes(issue.id) ? (
                    <div className="flex h-full w-full cursor-not-allowed items-center justify-center">
                      <Loader width={14} strokeWidth={2} className="animate-spin text-tertiary" />
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="flex h-full w-full cursor-pointer items-center justify-center text-placeholder hover:text-tertiary"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!subIssueHelpers.issue_visibility.includes(issueId)) {
                          setSubIssueHelpers(parentIssueId, "preview_loader", issueId);
                          await fetchSubIssues(workspaceSlug, projectId, issueId);
                          setSubIssueHelpers(parentIssueId, "preview_loader", issueId);
                        }
                        setSubIssueHelpers(parentIssueId, "issue_visibility", issueId);
                      }}
                    >
                      <ChevronRightIcon
                        className={cn("size-3.5 transition-all", {
                          "rotate-90": subIssueHelpers.issue_visibility.includes(issue.id),
                        })}
                        strokeWidth={2.5}
                      />
                    </button>
                  )}
                </>
              )}
            </div>

            {issue.type_id && issue.project_id && (
              <IssueTypeIdentifier issueTypeId={issue.type_id} projectId={issue.project_id} size="xs" />
            )}

            <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="key">
              <div className="flex-shrink-0">
                {projectDetail && (
                  <IssueIdentifier
                    projectId={projectDetail.id}
                    issueTypeId={issue.type_id}
                    projectIdentifier={projectDetail.identifier}
                    issueSequenceId={issue.sequence_id}
                    size="xs"
                    variant="secondary"
                  />
                )}
              </div>
            </WithDisplayPropertiesHOC>

            <Tooltip tooltipContent={issue.name} isMobile={isMobile}>
              <span className="min-w-0 flex-1 truncate text-13 text-primary">{issue.name}</span>
            </Tooltip>
          </div>

          <SubIssuesListItemPriorityCell {...cellProps} />
          <SubIssuesListItemAssigneeCell {...cellProps} />
          <SubIssuesListItemStateCell {...cellProps} />

          <div
            className="flex items-center justify-end"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <CustomMenu placement="bottom-end" ellipsis>
              {canEdit && (
                <CustomMenu.MenuItem
                  onClick={() => {
                    handleIssueCrudState("update", parentIssueId, { ...issue });
                    toggleCreateIssueModal(true);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <EditIcon className="h-3.5 w-3.5" strokeWidth={2} />
                    <span>{t("issue.edit")}</span>
                  </div>
                </CustomMenu.MenuItem>
              )}

              <CustomMenu.MenuItem
                onClick={() => {
                  subIssueOperations.copyLink(workItemLink);
                }}
              >
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-3.5 w-3.5" strokeWidth={2} />
                  <span>{t("issue.copy_link")}</span>
                </div>
              </CustomMenu.MenuItem>

              {canEdit && (
                <CustomMenu.MenuItem
                  onClick={() => {
                    if (issue.project_id)
                      subIssueOperations.removeSubIssue(workspaceSlug, issue.project_id, parentIssueId, issue.id);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <CloseIcon className="h-3.5 w-3.5" strokeWidth={2} />
                    {issueServiceType === EIssueServiceType.ISSUES
                      ? t("issue.remove.parent.label")
                      : t("issue.remove.label")}
                  </div>
                </CustomMenu.MenuItem>
              )}

              {canEdit && (
                <CustomMenu.MenuItem
                  onClick={() => {
                    handleIssueCrudState("delete", parentIssueId, issue);
                    toggleDeleteIssueModal(issue.id);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <TrashIcon className="h-3.5 w-3.5" strokeWidth={2} />
                    <span>{t("issue.delete.label")}</span>
                  </div>
                </CustomMenu.MenuItem>
              )}
            </CustomMenu>
          </div>
        </div>
      </ControlLink>

      {subIssueHelpers.issue_visibility.includes(issueId) &&
        issue.project_id &&
        subIssueCount > 0 &&
        !isCurrentIssueRoot && (
          <SubIssuesListRoot
            storeType={storeType}
            workspaceSlug={workspaceSlug}
            projectId={issue.project_id}
            parentIssueId={issue.id}
            rootIssueId={rootIssueId}
            spacingLeft={spacingLeft + 16}
            canEdit={canEdit}
            handleIssueCrudState={handleIssueCrudState}
            subIssueOperations={subIssueOperations}
          />
        )}
    </div>
  );
});
