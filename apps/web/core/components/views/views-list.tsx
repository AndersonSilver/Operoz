import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import { EmptyStateDetailed } from "@operoz/propel/empty-state";
import { EUserProjectRoles } from "@operoz/types";
// components
import { ListLayout } from "@/components/core/list";
import { ViewListLoader } from "@/components/ui/loader/view-list-loader";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useProjectView } from "@/hooks/store/use-project-view";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import { ProjectViewListItem } from "./view-list-item";

export const ProjectViewsList = observer(function ProjectViewsList() {
  const { projectId } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { toggleCreateViewModal } = useCommandPalette();
  const { getProjectViews, getFilteredProjectViews, loader } = useProjectView();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const projectViews = getProjectViews(projectId?.toString());
  const filteredProjectViews = getFilteredProjectViews(projectId?.toString());
  const canPerformEmptyStateActions = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER, EUserProjectRoles.GUEST],
    EUserPermissionsLevel.PROJECT
  );

  if (loader || !projectViews || !filteredProjectViews) return <ViewListLoader />;

  if (filteredProjectViews.length === 0 && projectViews.length > 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <EmptyStateDetailed
          assetKey="search"
          title={t("common_empty_state.search.title")}
          description={t("common_empty_state.search.description")}
        />
      </div>
    );
  }

  return (
    <>
      {filteredProjectViews.length > 0 ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <ListLayout>
            {filteredProjectViews.length > 0 ? (
              filteredProjectViews.map((view) => <ProjectViewListItem key={view.id} view={view} />)
            ) : (
              <p className="mt-10 text-center text-13 text-tertiary">No results found</p>
            )}
          </ListLayout>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <EmptyStateDetailed
            assetKey="view"
            title={t("project_empty_state.views.title")}
            description={t("project_empty_state.views.description")}
            actions={[
              {
                label: t("project_empty_state.views.cta_primary"),
                onClick: () => toggleCreateViewModal(true),
                disabled: !canPerformEmptyStateActions,
                variant: "primary",
              },
            ]}
          />
        </div>
      )}
    </>
  );
});
