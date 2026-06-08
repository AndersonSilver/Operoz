import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { EmptyStateCompact } from "@operis/propel/empty-state";
import { cn } from "@operis/ui";
import { useBoard } from "@/hooks/store/use-board";
import { WorkspaceBoardsSettingsBoardCard } from "./workspace-boards-settings-board-card";
import {
  DEFAULT_BOARDS_SETTINGS_FILTERS,
  filterBoardsSettings,
  hasActiveBoardsSettingsFilters,
} from "./workspace-boards-settings-filter";
import { WorkspaceBoardsSettingsToolbar } from "./workspace-boards-settings-toolbar";
import "./workspace-boards-settings.css";

type Props = {
  workspaceSlug: string;
  onCreate: () => void;
};

export const WorkspaceBoardsSettingsList = observer(function WorkspaceBoardsSettingsList(props: Props) {
  const { workspaceSlug, onCreate } = props;
  const { t } = useTranslation();
  const { currentWorkspaceAllBoardIds, getBoardById } = useBoard();
  const [filters, setFilters] = useState(DEFAULT_BOARDS_SETTINGS_FILTERS);

  const allBoards = useMemo(() => {
    return currentWorkspaceAllBoardIds
      .map((id) => getBoardById(id))
      .filter((b): b is NonNullable<ReturnType<typeof getBoardById>> => Boolean(b));
  }, [currentWorkspaceAllBoardIds, getBoardById]);

  const filteredBoards = useMemo(() => filterBoardsSettings(allBoards, filters), [allBoards, filters]);

  const showCreateCard = filters.status !== "archived";

  if (allBoards.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <WorkspaceBoardsSettingsToolbar
        filters={filters}
        resultCount={filteredBoards.length}
        onChange={setFilters}
      />

      {filteredBoards.length === 0 ? (
        <EmptyStateCompact
          assetKey="project"
          title={t("workspace_settings.settings.boards.filters.empty_search")}
          description={
            hasActiveBoardsSettingsFilters(filters)
              ? t("workspace_settings.settings.boards.filters.empty_search_hint")
              : undefined
          }
          actions={
            hasActiveBoardsSettingsFilters(filters)
              ? [
                  {
                    label: t("workspace_settings.settings.boards.filters.clear"),
                    onClick: () => setFilters(DEFAULT_BOARDS_SETTINGS_FILTERS),
                  },
                ]
              : undefined
          }
        />
      ) : (
        <div className="workspace-boards-card-grid">
          {showCreateCard && (
            <button
              type="button"
              onClick={onCreate}
              className={cn(
                "group flex min-h-[248px] h-full w-full flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-subtle",
                "bg-transparent px-5 py-8 text-center transition-all duration-150",
                "hover:border-accent-subtle hover:bg-accent-subtle/10",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1"
              )}
            >
              <span className="grid size-11 place-items-center rounded-xl border border-subtle bg-layer-1 text-accent-primary transition-colors group-hover:border-accent-subtle group-hover:bg-accent-subtle/30">
                <Plus className="size-5" strokeWidth={1.75} />
              </span>
              <span className="text-13 font-semibold text-primary">
                {t("workspace_settings.settings.boards.add_board")}
              </span>
              <span className="max-w-[12rem] text-11 leading-relaxed text-tertiary">
                {t("workspace_settings.settings.boards.hero.create_hint")}
              </span>
            </button>
          )}

          {filteredBoards.map((board) => (
            <WorkspaceBoardsSettingsBoardCard key={board.id} workspaceSlug={workspaceSlug} board={board} />
          ))}
        </div>
      )}
    </div>
  );
});
