import { observer } from "mobx-react";
import { useLocation } from "react-router";
import { BoardHubNavLink } from "@/components/board/board-hub-nav-link";
import { BoardHubTabNav } from "@/components/board/board-hub-tabs";
import { useTranslation } from "@operis/i18n";
import { BoardHubBackgroundPicker, useBoardHubHasBackground } from "@/components/board/board-hub-background";
import { BoardOverviewHeaderMenu } from "@/components/board/board-overview-header-menu";
import { ENABLE_WORKSPACE_BOARDS } from "@/constants/enable-boards";
import { Logo } from "@operis/propel/emoji-icon-picker";
import type { IBoard } from "@operis/types";
import { Header } from "@operis/ui";
import { cn } from "@operis/utils";

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
        <div className="flex min-w-0 w-full flex-col gap-4">
          <BoardHubNavLink
            to={`/${workspaceSlug}/boards`}
            className="w-fit text-12 font-medium text-tertiary transition-colors hover:text-secondary"
          >
            {t("boards.spaces_nav_label")}
          </BoardHubNavLink>
          <div className="flex min-w-0 w-full items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              {board ? (
                <span className="grid size-8 shrink-0 place-items-center rounded-md border border-subtle bg-layer-2">
                  <Logo logo={board.logo_props} size={20} />
                </span>
              ) : null}
              <h1 className="truncate text-16 font-semibold tracking-tight text-primary">{boardTitle}</h1>
            </div>
            {ENABLE_WORKSPACE_BOARDS && board ? (
              <div className="flex shrink-0 items-center gap-0.5">
                <BoardHubBackgroundPicker />
                <BoardOverviewHeaderMenu workspaceSlug={workspaceSlug} board={board} />
              </div>
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
