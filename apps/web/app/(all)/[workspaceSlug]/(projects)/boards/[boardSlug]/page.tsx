import { observer } from "mobx-react";
import { EUserPermissions, EUserPermissionsLevel } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { useBoardLayout } from "@/components/board/board-layout-context";
import { BoardOverview } from "@/components/board/board-overview";
import { PageHead } from "@/components/core/page-title";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { ENABLE_WORKSPACE_BOARDS } from "@/constants/enable-boards";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useWorkspace } from "@/hooks/store/use-workspace";
import type { Route } from "./+types/page";

function BoardOverviewPage(_props: Route.ComponentProps) {
  const { t } = useTranslation();
  const { currentWorkspace } = useWorkspace();
  const { board, isBoardLoading, workspaceSlug } = useBoardLayout();
  const { getProjectIdsForBoard, getPartialProjectById } = useProject();
  const { allowPermissions } = useUserPermissions();

  const canCreateProject =
    ENABLE_WORKSPACE_BOARDS &&
    allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.WORKSPACE);

  if (isBoardLoading && !board) {
    return (
      <>
        <PageHead title={t("boards.title")} />
        <div className="flex h-full items-center justify-center">
          <LogoSpinner />
        </div>
      </>
    );
  }

  if (!board) {
    return (
      <>
        <PageHead title={t("boards.not_found")} />
        <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
          <p className="text-15 font-medium text-primary">{t("boards.not_found")}</p>
          <p className="text-13 text-tertiary">{t("boards.not_found_hint")}</p>
        </div>
      </>
    );
  }

  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - ${board.name}` : board.name;
  const projectIds = getProjectIdsForBoard(board.id);

  return (
    <>
      <PageHead title={pageTitle} />
      <BoardOverview
        workspaceSlug={workspaceSlug}
        board={board}
        projectIds={projectIds}
        getPartialProjectById={getPartialProjectById}
        canCreateProject={canCreateProject}
      />
    </>
  );
}

export default observer(BoardOverviewPage);
