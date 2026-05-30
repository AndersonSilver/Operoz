import { useState } from "react";
import { observer } from "mobx-react";
import { MoreHorizontal, Settings } from "lucide-react";
import { EUserPermissions, EUserPermissionsLevel } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { IconButton } from "@operis/propel/icon-button";
import type { IBoard } from "@operis/types";
import { CustomMenu } from "@operis/ui";
import { ArchiveBoardModal } from "@/components/board/archive-board-modal";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  workspaceSlug: string;
  board: IBoard;
};

export const BoardOverviewHeaderMenu = observer(function BoardOverviewHeaderMenu(props: Props) {
  const { workspaceSlug, board } = props;
  const { t } = useTranslation();
  const router = useAppRouter();
  const { allowPermissions } = useUserPermissions();
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  if (board.archived_at) return null;

  const settingsHref = `/${workspaceSlug}/settings/boards/${board.slug}/`;

  return (
    <>
      <ArchiveBoardModal
        workspaceSlug={workspaceSlug}
        board={board}
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        onArchived={() => router.push(`/${workspaceSlug}/settings/boards/`)}
      />
      <CustomMenu
        menuItemsClassName="z-30"
        closeOnSelect
        customButton={
          <IconButton
            variant="ghost"
            size="sm"
            icon={MoreHorizontal}
            className="shrink-0 text-placeholder"
            aria-label={t("boards.settings.open_from_menu")}
          />
        }
      >
        <CustomMenu.MenuItem
          onClick={() => router.push(settingsHref)}
          className="flex items-center gap-2"
        >
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
