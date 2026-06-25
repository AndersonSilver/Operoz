import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { ChevronDown, ChevronUp, Download, MoreHorizontal, Plus } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { IBoardModuleStage } from "@operis/types";
import { CustomMenu, Loader } from "@operis/ui";
import { SettingsHeading } from "@/components/settings/heading";
import { useBoardModuleStage } from "@/hooks/store/use-board-module-stage";
import { BoardModuleStageCreateModal } from "./board-module-stage-create-modal";
import { BoardModuleStageEditModal } from "./board-module-stage-edit-modal";

type Props = {
  workspaceSlug: string;
  boardSlug: string;
};

export const BoardModuleStagesSettings = observer(function BoardModuleStagesSettings(props: Props) {
  const { workspaceSlug, boardSlug } = props;
  const { t } = useTranslation();
  const { fetchBoardModuleStages, getBoardModuleStages, updateBoardModuleStage } = useBoardModuleStage();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editStage, setEditStage] = useState<IBoardModuleStage | null>(null);
  const [seeding, setSeeding] = useState(false);

  const { isLoading, mutate } = useSWR(
    workspaceSlug && boardSlug ? `BOARD_MODULE_STAGES_SETTINGS_${workspaceSlug}_${boardSlug}` : null,
    () => fetchBoardModuleStages(workspaceSlug, boardSlug),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    }
  );

  const stages = getBoardModuleStages(workspaceSlug, boardSlug);

  const moveStage = async (item: IBoardModuleStage, direction: "up" | "down") => {
    const index = stages.findIndex((s) => s.id === item.id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= stages.length) return;
    const other = stages[swapIndex];
    try {
      await Promise.all([
        updateBoardModuleStage(workspaceSlug, boardSlug, item.id, { sort_order: other.sort_order }),
        updateBoardModuleStage(workspaceSlug, boardSlug, other.id, { sort_order: item.sort_order }),
      ]);
      await fetchBoardModuleStages(workspaceSlug, boardSlug);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const before = stages.length;
      await mutate();
      const after = getBoardModuleStages(workspaceSlug, boardSlug).length;
      if (after > before) {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("boards.settings.module_stages.seed_success_title"),
          message: t("boards.settings.module_stages.seed_success_message"),
        });
      } else {
        setToast({
          type: TOAST_TYPE.INFO,
          title: t("boards.settings.module_stages.seed_exists_title"),
          message: t("boards.settings.module_stages.seed_exists_message"),
        });
      }
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="w-full">
      <BoardModuleStageCreateModal
        workspaceSlug={workspaceSlug}
        boardSlug={boardSlug}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
      {editStage ? (
        <BoardModuleStageEditModal
          workspaceSlug={workspaceSlug}
          boardSlug={boardSlug}
          stage={editStage}
          isOpen={Boolean(editStage)}
          onClose={() => setEditStage(null)}
        />
      ) : null}
      <SettingsHeading
        title={t("boards.settings.module_stages.heading")}
        description={t("boards.settings.module_stages.description")}
        control={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="lg" loading={seeding} onClick={() => void handleSeedDefaults()}>
              <Download className="size-3.5" />
              {t("boards.settings.module_stages.seed_defaults")}
            </Button>
            <Button variant="primary" size="lg" onClick={() => setIsCreateOpen(true)}>
              <Plus className="size-3.5" />
              {t("boards.settings.module_stages.add_stage")}
            </Button>
          </div>
        }
      />
      {isLoading && stages.length === 0 ? (
        <Loader className="mt-6 w-full max-w-2xl space-y-2">
          <Loader.Item height="48px" />
          <Loader.Item height="48px" />
        </Loader>
      ) : (
        <div className="mt-6 max-w-2xl divide-y divide-subtle rounded-lg border border-subtle">
          {stages.length === 0 ? (
            <p className="p-4 text-13 text-tertiary">{t("boards.settings.module_stages.empty")}</p>
          ) : (
            stages.map((item, index) => (
              <div key={item.id} className={`flex items-center gap-3 px-4 py-3 ${!item.is_active ? "opacity-60" : ""}`}>
                <span
                  className="size-4 shrink-0 rounded-full border border-subtle"
                  style={{ backgroundColor: item.color?.startsWith("#") ? item.color : undefined }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-sm-medium text-primary">{item.name}</p>
                  {!item.is_active ? (
                    <p className="text-11 text-tertiary">{t("boards.settings.module_stages.inactive")}</p>
                  ) : item.is_default ? (
                    <p className="text-11 text-tertiary">{t("boards.settings.module_stages.default_badge")}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    className="grid size-7 place-items-center rounded-sm text-tertiary hover:bg-layer-transparent-hover hover:text-primary disabled:opacity-40"
                    disabled={index === 0}
                    aria-label={t("boards.settings.module_stages.move_up")}
                    onClick={() => void moveStage(item, "up")}
                  >
                    <ChevronUp className="size-4" strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    className="grid size-7 place-items-center rounded-sm text-tertiary hover:bg-layer-transparent-hover hover:text-primary disabled:opacity-40"
                    disabled={index === stages.length - 1}
                    aria-label={t("boards.settings.module_stages.move_down")}
                    onClick={() => void moveStage(item, "down")}
                  >
                    <ChevronDown className="size-4" strokeWidth={1.75} />
                  </button>
                  <CustomMenu
                    menuItemsClassName="z-20"
                    customButton={
                      <button
                        type="button"
                        className="grid size-7 place-items-center rounded-sm text-tertiary hover:bg-layer-transparent-hover hover:text-primary"
                        aria-label={t("boards.settings.module_stages.edit_stage")}
                      >
                        <MoreHorizontal className="size-4" strokeWidth={1.75} />
                      </button>
                    }
                  >
                    <CustomMenu.MenuItem onClick={() => setEditStage(item)}>
                      {t("boards.settings.module_stages.edit_stage")}
                    </CustomMenu.MenuItem>
                  </CustomMenu>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
});
