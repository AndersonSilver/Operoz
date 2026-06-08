import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { Outlet } from "react-router";
import useSWR from "swr";
import { useTranslation } from "@operis/i18n";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { getBoardActivePath } from "@/components/settings/helper";
import { SettingsMobileNav } from "@/components/settings/mobile/nav";
import { BoardSettingsCollapsibleSidebar } from "@/components/settings/board/sidebar/collapsible-sidebar";
import { BoardSettingsSidebarRoot } from "@/components/settings/board/sidebar/root";
import { ENABLE_WORKSPACE_BOARDS } from "@/constants/enable-boards";
import { BoardSettingsAuthWrapper } from "@/layouts/auth-layout/board-settings-wrapper";
import { useBoard } from "@/hooks/store/use-board";
import type { Route } from "./+types/layout";

function BoardDetailSettingsLayout({ params }: Route.ComponentProps) {
  const { workspaceSlug, boardSlug } = params;
  const pathname = usePathname();
  const { t } = useTranslation();
  const { fetchBoardDetails, getBoardBySlug } = useBoard();
  const board = getBoardBySlug(boardSlug);

  const { isLoading, error } = useSWR(
    ENABLE_WORKSPACE_BOARDS && workspaceSlug && boardSlug && !board
      ? `BOARD_SETTINGS_LAYOUT_${workspaceSlug}_${boardSlug}`
      : null,
    () => fetchBoardDetails(workspaceSlug, boardSlug),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    }
  );

  const activePath = getBoardActivePath(pathname) || "boards.settings.nav.informations";

  const content = () => {
    if (isLoading && !board && !error) {
      return (
        <div className="flex h-full min-h-[240px] w-full flex-1 items-center justify-center">
          <LogoSpinner />
        </div>
      );
    }
    if ((error || !board) && !isLoading) {
      return (
        <div className="flex h-full flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
          <p className="text-body-md-medium text-primary">{t("boards.not_found")}</p>
          <p className="text-13 text-tertiary">{t("boards.not_found_hint")}</p>
        </div>
      );
    }
    if (!board) {
      return (
        <div className="flex h-full min-h-[240px] w-full flex-1 items-center justify-center">
          <LogoSpinner />
        </div>
      );
    }
    return (
      <>
        <SettingsMobileNav
          hamburgerContent={(p) => <BoardSettingsSidebarRoot workspaceSlug={workspaceSlug} board={board} {...p} />}
          activePath={activePath}
        />
        <div className="flex h-full w-full min-w-0 flex-row">
          <div className="hidden h-full shrink-0 md:block">
            <BoardSettingsCollapsibleSidebar workspaceSlug={workspaceSlug} board={board} />
          </div>
          <main className="min-w-0 flex-1 overflow-hidden">
            <Outlet context={{ board, workspaceSlug, boardSlug }} />
          </main>
        </div>
      </>
    );
  };

  return (
    <BoardSettingsAuthWrapper workspaceSlug={workspaceSlug}>
      {content()}
    </BoardSettingsAuthWrapper>
  );
}

export default observer(BoardDetailSettingsLayout);
