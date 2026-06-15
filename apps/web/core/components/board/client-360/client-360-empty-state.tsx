import { useTranslation } from "@operis/i18n";
import { EmptyStateDetailed } from "@operis/propel/empty-state";
import type { Client360EmptyScenario } from "@/components/board/client-360/client-360-empty-state.utils";

type Props = {
  scenario: Client360EmptyScenario;
  canCreateProject?: boolean;
  onCreateProject?: () => void;
  onClearFilters?: () => void;
  onGoToProjects?: () => void;
  onGoToBoards?: () => void;
};

export function Client360EmptyState({
  scenario,
  canCreateProject = false,
  onCreateProject,
  onClearFilters,
  onGoToProjects,
  onGoToBoards,
}: Props) {
  const { t } = useTranslation();

  switch (scenario) {
    case "forbidden":
      return (
        <EmptyStateDetailed
          assetKey="no-access"
          align="center"
          rootClassName="px-6 py-12"
          title={t("boards.client_360.empty_forbidden_title")}
          description={t("boards.client_360.empty_forbidden_description")}
        />
      );
    case "api_error":
      return (
        <EmptyStateDetailed
          assetKey="server-error"
          align="center"
          rootClassName="px-6 py-12"
          title={t("boards.client_360.empty_error_title")}
          description={t("boards.client_360.empty_error_description")}
        />
      );
    case "no_projects":
      return (
        <EmptyStateDetailed
          assetKey="project"
          align="center"
          rootClassName="px-6 py-12"
          title={t("boards.client_360.empty_no_projects_title")}
          description={t("boards.client_360.empty_no_projects_description")}
          actions={[
            {
              label: t("boards.client_360.empty_no_projects_cta_create"),
              variant: "primary",
              onClick: onCreateProject,
              disabled: !canCreateProject || !onCreateProject,
            },
            {
              label: t("boards.client_360.empty_no_projects_cta_boards"),
              variant: "secondary",
              onClick: onGoToBoards,
              disabled: !onGoToBoards,
            },
          ]}
        />
      );
    case "guest_no_clients":
      return (
        <EmptyStateDetailed
          assetKey="no-access"
          align="center"
          rootClassName="px-6 py-12"
          title={t("boards.client_360.empty_guest_title")}
          description={t("boards.client_360.empty_guest_description")}
        />
      );
    case "filtered_empty":
      return (
        <EmptyStateDetailed
          assetKey="search"
          align="center"
          rootClassName="px-6 py-12"
          title={t("boards.client_360.empty_filtered_title")}
          description={t("boards.client_360.empty_filtered_description")}
          actions={[
            {
              label: t("boards.client_360.empty_filtered_cta_clear"),
              variant: "primary",
              onClick: onClearFilters,
              disabled: !onClearFilters,
            },
            {
              label: t("boards.client_360.empty_filtered_cta_projects"),
              variant: "secondary",
              onClick: onGoToProjects,
              disabled: !onGoToProjects,
            },
          ]}
        />
      );
  }
}
