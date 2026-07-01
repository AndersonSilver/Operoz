import { observer } from "mobx-react";
import { useLocation } from "react-router";
import { BoardHubNavLink } from "@/components/board/board-hub-nav-link";
import { BoardHubTabNav } from "@/components/board/board-hub-tabs";
import { useTranslation } from "@operoz/i18n";
import { useBoardHubHasBackground, BOARD_HUB_IMMERSIVE_TEXT_SHADOW } from "@/components/board/board-hub-background";
import { BoardOverviewHeaderMenu } from "@/components/board/board-overview-header-menu";
import { ENABLE_WORKSPACE_BOARDS } from "@/constants/enable-boards";
import { Logo } from "@operoz/propel/emoji-icon-picker";
import type { IBoard } from "@operoz/types";
import { Header } from "@operoz/ui";
import { cn } from "@operoz/utils";

type Props = {
  board?: IBoard;
  workspaceSlug: string;
  boardSlug: string;
};

export const BoardOverviewHeader = observer(function BoardOverviewHeader(props: Props) {
  const { board, workspaceSlug, boardSlug } = props;
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const hasBackground = useBoardHubHasBackground();

  const boardTitle = board?.name ?? boardSlug;

  return (
    <Header className={cn(hasBackground && "!border-none !bg-transparent")}>
      <Header.LeftItem className="min-w-0 items-start">
        <div className="flex w-full min-w-0 flex-col gap-2">
          <BoardHubNavLink
            to={`/${workspaceSlug}/boards`}
            className={cn(
              "w-fit text-11 font-medium transition-colors",
              hasBackground
                ? cn("text-white/70 hover:text-white/90", BOARD_HUB_IMMERSIVE_TEXT_SHADOW)
                : "text-tertiary hover:text-secondary"
            )}
          >
            {t("boards.spaces_nav_label")}
          </BoardHubNavLink>
          <div className="flex w-full min-w-0 items-center gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              {board ? (
                <span
                  className={cn(
                    "shadow-sm grid size-8 shrink-0 place-items-center rounded-md border",
                    hasBackground ? "border-white/25 bg-white/12 backdrop-blur-sm" : "border-subtle bg-layer-2"
                  )}
                >
                  <Logo logo={board.logo_props} size={20} />
                </span>
              ) : null}
              <h1
                className={cn(
                  "text-15 truncate font-semibold tracking-tight",
                  hasBackground ? cn("text-white", BOARD_HUB_IMMERSIVE_TEXT_SHADOW) : "text-primary"
                )}
              >
                {boardTitle}
              </h1>
            </div>
            {ENABLE_WORKSPACE_BOARDS && board ? (
              <BoardOverviewHeaderMenu workspaceSlug={workspaceSlug} board={board} immersive={hasBackground} />
            ) : null}
          </div>
          {ENABLE_WORKSPACE_BOARDS && board ? (
            <BoardHubTabNav
              workspaceSlug={workspaceSlug}
              boardSlug={boardSlug}
              pathname={pathname}
              immersive={hasBackground}
            />
          ) : null}
        </div>
      </Header.LeftItem>
    </Header>
  );
});
