import { useState } from "react";
import { observer } from "mobx-react";
import { ExternalLink, FolderKanban, MoreHorizontal, Settings } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Avatar } from "@operis/propel/avatar";
import { Logo } from "@operis/propel/emoji-icon-picker";
import { IconButton } from "@operis/propel/icon-button";
import type { IBoard, IUserLite } from "@operis/types";
import { CustomMenu } from "@operis/ui";
import { calculateTimeAgo, cn, getFileURL } from "@operis/utils";
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
import { getBoardIdentifier } from "./board-spaces-utils";
import { ArchiveBoardModal } from "./archive-board-modal";
import { EditBoardModal } from "./edit-board-modal";
import { UnarchiveBoardModal } from "./unarchive-board-modal";
import "./workspace-boards-settings.css";

type Props = {
  workspaceSlug: string;
  board: IBoard;
};

function resolveBoardLead(lead: IBoard["board_lead"]): IUserLite | null {
  if (!lead || typeof lead === "string") return null;
  return lead;
}

function getSpaceTypeLabel(t: (key: string) => string, spaceType?: string): string {
  if (spaceType === "company_managed") return t("boards.spaces_type_company_managed");
  return t("boards.spaces_type_team_managed");
}

export const WorkspaceBoardsSettingsBoardCard = observer(function WorkspaceBoardsSettingsBoardCard(
  props: Props
) {
  const { workspaceSlug, board } = props;
  const { t } = useTranslation();
  const router = useAppRouter();
  const { getProjectIdsForBoard } = useProject();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isUnarchiveOpen, setIsUnarchiveOpen] = useState(false);

  const isArchived = Boolean(board.archived_at);
  const boardKey = getBoardIdentifier(board);
  const lead = resolveBoardLead(board.board_lead);
  const projectCount = getProjectIdsForBoard(board.id).length;
  const settingsPath = `/${workspaceSlug}/settings/boards/${board.slug}/`;
  const boardPath = `/${workspaceSlug}/boards/${board.slug}`;
  const description = board.description?.trim();
  const updatedLabel = board.updated_at ? calculateTimeAgo(board.updated_at) : null;

  const openSettings = () => {
    router.push(settingsPath);
  };

  return (
    <>
      <EditBoardModal workspaceSlug={workspaceSlug} board={board} isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} />
      <ArchiveBoardModal workspaceSlug={workspaceSlug} board={board} isOpen={isArchiveOpen} onClose={() => setIsArchiveOpen(false)} />
      <UnarchiveBoardModal workspaceSlug={workspaceSlug} board={board} isOpen={isUnarchiveOpen} onClose={() => setIsUnarchiveOpen(false)} />

      <article
        className={cn(
          "group relative flex min-h-[248px] flex-col overflow-hidden rounded-xl border border-subtle bg-layer-1 transition-all duration-150",
          "hover:border-strong hover:shadow-raised-100",
          !isArchived && "workspace-boards-card-active",
          isArchived && "opacity-80"
        )}
      >
        <span
          className={cn("absolute inset-x-0 top-0 h-0.5", isArchived ? "bg-subtle" : "bg-accent-primary")}
          aria-hidden
        />

        <div className="absolute right-2 top-2 z-10" onClick={(e) => e.stopPropagation()}>
          <CustomMenu
            menuItemsClassName="z-30"
            closeOnSelect
            customButton={
              <IconButton
                variant="ghost"
                size="sm"
                icon={MoreHorizontal}
                className="text-placeholder opacity-70 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                aria-label={t("boards.edit")}
              />
            }
          >
            {isArchived ? (
              <CustomMenu.MenuItem onClick={() => setIsUnarchiveOpen(true)}>{t("boards.unarchive")}</CustomMenu.MenuItem>
            ) : (
              <>
                <CustomMenu.MenuItem onClick={() => router.push(settingsPath)}>
                  {t("boards.settings.open_from_menu")}
                </CustomMenu.MenuItem>
                <CustomMenu.MenuItem onClick={() => router.push(boardPath)}>
                  <span className="flex items-center gap-2">
                    {t("workspace_settings.settings.boards.card.open_board")}
                    <ExternalLink className="size-3 opacity-60" />
                  </span>
                </CustomMenu.MenuItem>
                <CustomMenu.MenuItem onClick={() => setIsEditOpen(true)}>{t("boards.edit")}</CustomMenu.MenuItem>
                <CustomMenu.MenuItem onClick={() => setIsArchiveOpen(true)}>{t("boards.archive")}</CustomMenu.MenuItem>
              </>
            )}
          </CustomMenu>
        </div>

        <button
          type="button"
          className="flex flex-1 flex-col p-5 text-left transition-colors group-hover:bg-layer-1-hover/40"
          onClick={openSettings}
        >
          <div className="flex items-start gap-3 pr-8">
            <span className="grid size-12 shrink-0 place-items-center rounded-lg border border-subtle bg-surface-1 shadow-sm">
              <Logo logo={board.logo_props} size={26} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="line-clamp-2 text-15 font-semibold leading-snug tracking-tight text-primary">
                  {board.name}
                </h3>
                {isArchived && (
                  <span className="shrink-0 rounded-full bg-layer-2 px-2 py-0.5 text-10 font-semibold uppercase tracking-wide text-tertiary">
                    {t("boards.archived_badge")}
                  </span>
                )}
              </div>
              <p className="mt-1 font-mono text-11 text-secondary">{boardKey}</p>
            </div>
          </div>

          {description ? (
            <p className="mt-3 line-clamp-2 text-12 leading-relaxed text-secondary">{description}</p>
          ) : (
            <p className="mt-3 truncate font-mono text-11 text-placeholder">/boards/{board.slug}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-11 text-tertiary">
            <span className="inline-flex items-center gap-1.5">
              <FolderKanban className="size-3.5 shrink-0 opacity-70" strokeWidth={1.75} aria-hidden />
              {projectCount > 0
                ? t("workspace_settings.settings.boards.card.projects_count", { count: projectCount })
                : t("workspace_settings.settings.boards.card.no_projects")}
            </span>
            {updatedLabel ? (
              <>
                <span className="text-subtle" aria-hidden>
                  ·
                </span>
                <span>
                  {t("workspace_settings.settings.boards.card.updated", { time: updatedLabel })}
                </span>
              </>
            ) : null}
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
            <span className="rounded-md border border-subtle bg-layer-2 px-2 py-0.5 text-10 font-medium text-secondary">
              {getSpaceTypeLabel(t, board.space_type)}
            </span>
            {board.category?.trim() ? (
              <span className="rounded-md border border-subtle bg-layer-2 px-2 py-0.5 text-10 font-medium text-secondary">
                {board.category}
              </span>
            ) : null}
          </div>
        </button>

        <footer className="flex items-center justify-between gap-2 border-t border-subtle px-5 py-3">
          {lead ? (
            <div className="flex min-w-0 items-center gap-2">
              <Avatar name={lead.display_name} src={getFileURL(lead.avatar_url)} size="sm" />
              <span className="truncate text-11 text-secondary">{lead.display_name}</span>
            </div>
          ) : (
            <span className="text-11 text-placeholder">{t("boards.spaces_col_lead")}: —</span>
          )}
          <button
            type="button"
            onClick={openSettings}
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-11 font-medium text-accent-primary opacity-80 transition-opacity hover:bg-accent-subtle/30 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <Settings className="size-3" />
            {t("workspace_settings.settings.boards.card.open_settings")}
          </button>
        </footer>
      </article>
    </>
  );
});
