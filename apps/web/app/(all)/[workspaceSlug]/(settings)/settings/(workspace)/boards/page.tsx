import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { EUserPermissions, EUserPermissionsLevel } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { EmptyStateCompact } from "@operis/propel/empty-state";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { CreateBoardModal } from "@/components/board/create-board-modal";
import { WorkspaceBoardsSettingsList } from "@/components/board/workspace-boards-settings-list";
import { PageHead } from "@/components/core/page-title";
import { SettingsHeading } from "@/components/settings/heading";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { Loader } from "@operis/ui";
import { ENABLE_WORKSPACE_BOARDS } from "@/constants/enable-boards";
import { useBoard } from "@/hooks/store/use-board";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import type { Route } from "./+types/page";
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
    <SettingsContentWrapper header={<BoardsWorkspaceSettingsHeader />}>
      <PageHead title={pageTitle} />
      <div className="w-full">
        <CreateBoardModal
          workspaceSlug={workspaceSlug}
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
        <SettingsHeading
          title={t("workspace_settings.settings.boards.title")}
          description={t("workspace_settings.settings.boards.description")}
          control={
            <Button variant="primary" size="lg" onClick={() => setShowCreateModal(true)}>
              {t("workspace_settings.settings.boards.add_board")}
            </Button>
          }
        />
        {isLoading ? (
          <Loader className="mt-8 w-full max-w-md space-y-2">
            <Loader.Item height="52px" />
            <Loader.Item height="52px" />
          </Loader>
        ) : hasBoards ? (
          <WorkspaceBoardsSettingsList workspaceSlug={workspaceSlug} />
        ) : (
          <div className="flex h-full w-full flex-col">
            <div className="flex h-full w-full items-center justify-center">
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
          </div>
        )}
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(BoardsSettingsPage);
