import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { EUserPermissions, EUserPermissionsLevel } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import { EmptyStateCompact } from "@operoz/propel/empty-state";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { CreateBoardModal } from "@/components/board/create-board-modal";
import { WorkspaceBoardsSettingsHero } from "@/components/board/workspace-boards-settings-hero";
import { WorkspaceBoardsSettingsList } from "@/components/board/workspace-boards-settings-list";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { Loader } from "@operoz/ui";
import { ENABLE_WORKSPACE_BOARDS } from "@/constants/enable-boards";
import { useBoard } from "@/hooks/store/use-board";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import type { Route } from "./+types/page";
import "@/components/board/workspace-boards-settings.css";
import { BoardsWorkspaceSettingsHeader } from "./header";

function BoardsSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  const { t } = useTranslation();
  const router = useAppRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { allowPermissions, workspaceUserInfo } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { fetchBoards, loader, currentWorkspaceAllBoardIds } = useBoard();

  const canPerformWorkspaceAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  useSWR(
    ENABLE_WORKSPACE_BOARDS && canPerformWorkspaceAdminActions ? `WORKSPACE_BOARDS_SETTINGS_${workspaceSlug}` : null,
    () => fetchBoards(workspaceSlug, { includeArchived: true })
  );

  useEffect(() => {
    if (!ENABLE_WORKSPACE_BOARDS) {
      router.replace(`/${workspaceSlug}/settings/`);
    }
  }, [router, workspaceSlug]);

  if (!ENABLE_WORKSPACE_BOARDS) return null;

  if (workspaceUserInfo && !canPerformWorkspaceAdminActions) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${t("workspace_settings.settings.boards.title")}`
    : undefined;

  const isLoading = loader === "init-loader";
  const hasBoards = currentWorkspaceAllBoardIds.length > 0;

  return (
    <SettingsContentWrapper hugging header={<BoardsWorkspaceSettingsHeader />}>
      <PageHead title={pageTitle} />
      <div className="flex w-full flex-col gap-6">
        <CreateBoardModal
          workspaceSlug={workspaceSlug}
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
        <WorkspaceBoardsSettingsHero boardCount={currentWorkspaceAllBoardIds.length} />
        {isLoading ? (
          <Loader className="workspace-boards-card-grid w-full">
            <Loader.Item height="220px" />
            <Loader.Item height="220px" />
            <Loader.Item height="220px" />
          </Loader>
        ) : hasBoards ? (
          <WorkspaceBoardsSettingsList workspaceSlug={workspaceSlug} onCreate={() => setShowCreateModal(true)} />
        ) : (
          <div className="w-full">
            <EmptyStateCompact
              assetKey="project"
              title={t("settings_empty_state.boards.title")}
              description={t("settings_empty_state.boards.description")}
              actions={[
                {
                  label: t("settings_empty_state.boards.cta_primary"),
                  onClick: () => setShowCreateModal(true),
                },
              ]}
            />
          </div>
        )}
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(BoardsSettingsPage);
