import { useState } from "react";
import { observer } from "mobx-react";
import { Image, MoreHorizontal, Settings } from "lucide-react";
import { EUserPermissions, EUserPermissionsLevel } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { IconButton } from "@operis/propel/icon-button";
import type { IBoard } from "@operis/types";
import { CustomMenu } from "@operis/ui";
import { cn } from "@operis/utils";
import { ArchiveBoardModal } from "@/components/board/archive-board-modal";
import {
  BoardHubBackgroundModal,
  BOARD_HUB_IMMERSIVE_TEXT_SHADOW,
  useBoardHubBackgroundOptional,
} from "@/components/board/board-hub-background";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  workspaceSlug: string;
  board: IBoard;
  className?: string;
  immersive?: boolean;
};

export const BoardOverviewHeaderMenu = observer(function BoardOverviewHeaderMenu(props: Props) {
  const { workspaceSlug, board, className, immersive = false } = props;
  const { t } = useTranslation();
  const router = useAppRouter();
  const { allowPermissions } = useUserPermissions();
  const background = useBoardHubBackgroundOptional();
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isBackgroundOpen, setIsBackgroundOpen] = useState(false);

  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  if (board.archived_at) return null;

  const settingsHref = `/${workspaceSlug}/settings/boards/${board.slug}/`;
  const hasBackground = background?.value.type !== "none";

  return (
    <>
      <ArchiveBoardModal
        workspaceSlug={workspaceSlug}
        board={board}
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        onArchived={() => router.push(`/${workspaceSlug}/settings/boards/`)}
      />
      {background ? (
        <BoardHubBackgroundModal isOpen={isBackgroundOpen} onClose={() => setIsBackgroundOpen(false)} />
      ) : null}
      <CustomMenu
        menuItemsClassName="z-30"
        closeOnSelect
        customButton={
          <IconButton
            variant="ghost"
            size="sm"
            icon={MoreHorizontal}
            className={cn(
              "shrink-0",
              immersive ? cn("text-white/90 hover:text-white", BOARD_HUB_IMMERSIVE_TEXT_SHADOW) : "text-placeholder",
              hasBackground && !immersive && "text-accent-primary",
              className
            )}
            aria-label={t("boards.settings.open_from_menu")}
          />
        }
      >
        {background ? (
          <CustomMenu.MenuItem onClick={() => setIsBackgroundOpen(true)} className="flex items-center gap-2">
            <Image className="size-3.5" />
            {t("boards.board_bg_button")}
          </CustomMenu.MenuItem>
        ) : null}
        <CustomMenu.MenuItem onClick={() => router.push(settingsHref)} className="flex items-center gap-2">
          <Settings className="size-3.5" />
          {t("boards.settings.open_from_menu")}
        </CustomMenu.MenuItem>
        {isAdmin ? (
          <CustomMenu.MenuItem onClick={() => setIsArchiveOpen(true)}>{t("boards.archive")}</CustomMenu.MenuItem>
        ) : null}
      </CustomMenu>
    </>
  );
});
