import { useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@operis/i18n";
import { Logo } from "@operis/propel/emoji-icon-picker";
import { IconButton } from "@operis/propel/icon-button";
import type { IBoard } from "@operis/types";
import { CustomMenu } from "@operis/ui";
import { cn } from "@operis/utils";
import { MoreHorizontal } from "lucide-react";
import { useAppRouter } from "@/hooks/use-app-router";
import { ArchiveBoardModal } from "./archive-board-modal";
import { EditBoardModal } from "./edit-board-modal";
import { UnarchiveBoardModal } from "./unarchive-board-modal";

type Props = {
  workspaceSlug: string;
  board: IBoard;
};

export const WorkspaceBoardsSettingsListItem = observer(function WorkspaceBoardsSettingsListItem(props: Props) {
  const { workspaceSlug, board } = props;
  const { t } = useTranslation();
  const router = useAppRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isUnarchiveOpen, setIsUnarchiveOpen] = useState(false);

  const isArchived = Boolean(board.archived_at);

  return (
    <>
      <EditBoardModal workspaceSlug={workspaceSlug} board={board} isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} />
      <ArchiveBoardModal workspaceSlug={workspaceSlug} board={board} isOpen={isArchiveOpen} onClose={() => setIsArchiveOpen(false)} />
      <UnarchiveBoardModal workspaceSlug={workspaceSlug} board={board} isOpen={isUnarchiveOpen} onClose={() => setIsUnarchiveOpen(false)} />
      <div className={cn("rounded-lg border border-subtle bg-layer-2 px-4 py-3", isArchived && "opacity-70")}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md border border-subtle bg-layer-1">
              <Logo logo={board.logo_props} size={20} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h5 className="truncate text-body-sm-medium text-primary">{board.name}</h5>
                {isArchived && (
                  <span className="shrink-0 rounded bg-layer-transparent-hover px-1.5 py-0.5 text-11 text-tertiary">
                    {t("boards.archived_badge")}
                  </span>
                )}
              </div>
              <p className="truncate text-11 text-tertiary">/boards/{board.slug}</p>
            </div>
          </div>
          <CustomMenu
            menuItemsClassName="z-30"
            closeOnSelect
            customButton={
              <IconButton
                variant="ghost"
                size="sm"
                icon={MoreHorizontal}
                className="shrink-0 text-placeholder"
                aria-label={t("boards.edit")}
              />
            }
          >
            {isArchived ? (
              <CustomMenu.MenuItem onClick={() => setIsUnarchiveOpen(true)}>{t("boards.unarchive")}</CustomMenu.MenuItem>
            ) : (
              <>
                <CustomMenu.MenuItem onClick={() => router.push(`/${workspaceSlug}/settings/boards/${board.slug}/`)}>
                  {t("boards.settings.open_from_menu")}
                </CustomMenu.MenuItem>
                <CustomMenu.MenuItem onClick={() => setIsEditOpen(true)}>{t("boards.edit")}</CustomMenu.MenuItem>
                <CustomMenu.MenuItem onClick={() => setIsArchiveOpen(true)}>{t("boards.archive")}</CustomMenu.MenuItem>
              </>
            )}
          </CustomMenu>
        </div>
      </div>
    </>
  );
});
