import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { ChevronDown, ChevronUp, MoreHorizontal, Plus } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Logo } from "@operoz/propel/emoji-icon-picker";
import { Button } from "@operoz/propel/button";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { IBoardIssueType } from "@operoz/types";
import { CustomMenu, Loader, ToggleSwitch } from "@operoz/ui";
import { SettingsHeading } from "@/components/settings/heading";
import { useBoardIssueType } from "@/hooks/store/use-board-issue-type";
import { BoardIssueTypeCreateModal } from "./board-issue-type-create-modal";
import { BoardIssueTypeEditModal } from "./board-issue-type-edit-modal";

type Props = {
  workspaceSlug: string;
  boardSlug: string;
};

export const BoardIssueTypesSettings = observer(function BoardIssueTypesSettings(props: Props) {
  const { workspaceSlug, boardSlug } = props;
  const { t } = useTranslation();
  const { fetchBoardIssueTypes, getBoardIssueTypes, updateBoardIssueType } = useBoardIssueType();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editType, setEditType] = useState<IBoardIssueType | null>(null);

  const { isLoading } = useSWR(
    workspaceSlug && boardSlug ? `BOARD_ISSUE_TYPES_${workspaceSlug}_${boardSlug}` : null,
    () => fetchBoardIssueTypes(workspaceSlug, boardSlug),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    }
  );

  const types = getBoardIssueTypes(workspaceSlug, boardSlug);
  const enabledTypes = types.filter((item) => item.is_enabled);

  const moveType = async (item: IBoardIssueType, direction: "up" | "down") => {
    const index = types.findIndex((t) => t.id === item.id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= types.length) return;
    const other = types[swapIndex];
    try {
      await Promise.all([
        updateBoardIssueType(workspaceSlug, boardSlug, item.id, { sort_order: other.sort_order }),
        updateBoardIssueType(workspaceSlug, boardSlug, other.id, { sort_order: item.sort_order }),
      ]);
      await fetchBoardIssueTypes(workspaceSlug, boardSlug);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  const toggleEnabled = async (item: IBoardIssueType, enabled: boolean) => {
    try {
      await updateBoardIssueType(workspaceSlug, boardSlug, item.id, { is_enabled: enabled });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  return (
    <div className="w-full">
      <BoardIssueTypeCreateModal
        workspaceSlug={workspaceSlug}
        boardSlug={boardSlug}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
      {editType && (
        <BoardIssueTypeEditModal
          workspaceSlug={workspaceSlug}
          boardSlug={boardSlug}
          boardIssueType={editType}
          isOpen={Boolean(editType)}
          onClose={() => setEditType(null)}
        />
      )}
      <SettingsHeading
        title={t("boards.settings.issue_types.heading")}
        description={t("boards.settings.issue_types.description")}
        control={
          <Button variant="primary" size="lg" onClick={() => setIsCreateOpen(true)}>
            <Plus className="size-3.5" />
            {t("boards.settings.issue_types.add_type")}
          </Button>
        }
      />
      {isLoading && types.length === 0 ? (
        <Loader className="mt-6 w-full max-w-2xl space-y-2">
          <Loader.Item height="48px" />
          <Loader.Item height="48px" />
        </Loader>
      ) : (
        <div className="mt-6 max-w-2xl divide-y divide-subtle rounded-lg border border-subtle">
          {types.length === 0 ? (
            <p className="p-4 text-13 text-tertiary">{t("boards.settings.issue_types.empty")}</p>
          ) : (
            types.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 px-4 py-3 ${!item.is_enabled ? "opacity-60" : ""}`}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-md border border-subtle bg-layer-2">
                  <Logo logo={item.logo_props} size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-sm-medium text-primary">{item.name}</p>
                  {!item.is_enabled && (
                    <p className="text-11 text-tertiary">{t("boards.settings.issue_types.disabled")}</p>
                  )}
                </div>
                <ToggleSwitch value={item.is_enabled} onChange={(val) => toggleEnabled(item, val)} size="sm" />
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    className="rounded p-0.5 text-placeholder hover:bg-layer-transparent-hover disabled:opacity-30"
                    disabled={index === 0}
                    onClick={() => moveType(item, "up")}
                    aria-label={t("boards.settings.issue_types.move_up")}
                  >
                    <ChevronUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    className="rounded p-0.5 text-placeholder hover:bg-layer-transparent-hover disabled:opacity-30"
                    disabled={index === types.length - 1}
                    onClick={() => moveType(item, "down")}
                    aria-label={t("boards.settings.issue_types.move_down")}
                  >
                    <ChevronDown className="size-3.5" />
                  </button>
                </div>
                <CustomMenu
                  menuItemsClassName="z-30"
                  closeOnSelect
                  customButton={<MoreHorizontal className="size-4 text-placeholder" />}
                >
                  <CustomMenu.MenuItem onClick={() => setEditType(item)}>
                    {t("boards.settings.issue_types.edit_type")}
                  </CustomMenu.MenuItem>
                </CustomMenu>
              </div>
            ))
          )}
        </div>
      )}
      {enabledTypes.length > 0 && (
        <p className="mt-3 text-11 text-tertiary">
          {t("boards.settings.issue_types.enabled_count", { count: enabledTypes.length })}
        </p>
      )}
    </div>
  );
});
