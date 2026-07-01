/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { ChevronDown, ChevronUp, MoreHorizontal, Plus, Search } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IBoardCustomField, TBoardFieldFormSpan } from "@plane/types";
import { CustomMenu, Input, Loader } from "@plane/ui";
import { SettingsHeading } from "@/components/settings/heading";
import { useBoardCustomField } from "@/hooks/store/use-board-custom-field";
import { BoardCustomFieldAddModal } from "./board-custom-field-add-modal";
import { BoardCustomFieldDeleteWorkspaceModal } from "./board-custom-field-delete-workspace-modal";
import { BoardCustomFieldEditModal } from "./board-custom-field-edit-modal";
import { BoardCustomFieldTypeGlyph } from "./board-custom-field-type-glyph";
import { getBoardFieldDisplayName } from "./board-field-display";
import { BoardFieldLayoutMenu } from "./board-field-layout-menu";

type Props = {
  workspaceSlug: string;
  boardSlug: string;
  boardName: string;
};

export const BoardCustomFieldsSettings = observer(function BoardCustomFieldsSettings(props: Props) {
  const { workspaceSlug, boardSlug, boardName } = props;
  const { t } = useTranslation();
  const { fetchBoardCustomFields, getBoardCustomFields, removeBoardCustomField, updateBoardCustomField } =
    useBoardCustomField();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [preselectFieldId, setPreselectFieldId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editField, setEditField] = useState<IBoardCustomField | null>(null);
  const [deleteField, setDeleteField] = useState<IBoardCustomField | null>(null);

  const { isLoading } = useSWR(
    workspaceSlug && boardSlug ? `BOARD_CUSTOM_FIELDS_${workspaceSlug}_${boardSlug}` : null,
    () => fetchBoardCustomFields(workspaceSlug, boardSlug),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    }
  );

  // Não usar useMemo aqui: o store MobX atualiza após fetch/add/remove e o observer precisa reler.
  const fields = [...getBoardCustomFields(workspaceSlug, boardSlug)]
    .filter((item) => item.is_enabled)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const filteredFields = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return fields;
    return fields.filter((item) => {
      const displayName = getBoardFieldDisplayName(item, t).toLowerCase();
      const typeLabel = t(`boards.settings.fields.types.${item.field_type}`).toLowerCase();
      return (
        displayName.includes(q) ||
        (item.description ?? "").toLowerCase().includes(q) ||
        typeLabel.includes(q)
      );
    });
  }, [fields, search, t]);

  const handleRemove = async (item: IBoardCustomField) => {
    const displayName = getBoardFieldDisplayName(item, t);
    try {
      await removeBoardCustomField(workspaceSlug, boardSlug, item.id);
      await fetchBoardCustomFields(workspaceSlug, boardSlug);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("boards.settings.fields.remove_success_title"),
        message: t("boards.settings.fields.remove_success_message", { name: displayName }),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  const openAddModal = () => {
    setPreselectFieldId(null);
    setIsAddOpen(true);
  };

  const persistFieldOrder = async (ordered: IBoardCustomField[]) => {
    await Promise.all(
      ordered.map((field, index) =>
        updateBoardCustomField(workspaceSlug, boardSlug, field.id, { sort_order: (index + 1) * 1000 })
      )
    );
    await fetchBoardCustomFields(workspaceSlug, boardSlug);
  };

  const moveField = async (item: IBoardCustomField, direction: "up" | "down") => {
    const idx = fields.findIndex((f) => f.id === item.id);
    if (idx < 0) return;
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    const [removed] = next.splice(idx, 1);
    next.splice(target, 0, removed);
    await persistFieldOrder(next);
  };

  const setFormSpan = async (item: IBoardCustomField, formSpan: TBoardFieldFormSpan) => {
    await updateBoardCustomField(workspaceSlug, boardSlug, item.id, { form_span: formSpan });
    await fetchBoardCustomFields(workspaceSlug, boardSlug);
  };

  return (
    <div className="w-full">
      <BoardCustomFieldAddModal
        workspaceSlug={workspaceSlug}
        boardSlug={boardSlug}
        boardName={boardName}
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setPreselectFieldId(null);
        }}
        preselectFieldId={preselectFieldId}
      />
      {editField && !editField.is_system && (
        <BoardCustomFieldEditModal
          workspaceSlug={workspaceSlug}
          boardSlug={boardSlug}
          boardField={editField}
          isOpen={Boolean(editField)}
          onClose={() => setEditField(null)}
        />
      )}
      {deleteField && !deleteField.is_system && (
        <BoardCustomFieldDeleteWorkspaceModal
          workspaceSlug={workspaceSlug}
          boardSlug={boardSlug}
          boardField={deleteField}
          isOpen={Boolean(deleteField)}
          onClose={() => setDeleteField(null)}
        />
      )}
      <SettingsHeading
        title={t("boards.settings.fields.heading")}
        description={t("boards.settings.fields.table_description")}
        control={
          <Button variant="primary" size="lg" onClick={openAddModal}>
            <Plus className="size-3.5" />
            {t("boards.settings.fields.add_field")}
          </Button>
        }
      />

      {fields.length > 0 && (
        <div className="relative mt-6 w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-placeholder" />
          <Input
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("boards.settings.fields.search_placeholder")}
          />
        </div>
      )}

      {isLoading && fields.length === 0 ? (
        <Loader className="mt-6 w-full space-y-2">
          <Loader.Item height="40px" />
          <Loader.Item height="48px" />
          <Loader.Item height="48px" />
        </Loader>
      ) : (
        <div className="mt-4 w-full overflow-hidden rounded-lg border border-subtle">
          {fields.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <p className="text-13 text-tertiary">{t("boards.settings.fields.empty")}</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button variant="primary" size="sm" onClick={openAddModal}>
                  <Plus className="size-3.5" />
                  {t("boards.settings.fields.add_field")}
                </Button>
              </div>
            </div>
          ) : filteredFields.length === 0 ? (
            <p className="px-4 py-8 text-center text-13 text-tertiary">{t("boards.settings.fields.search_empty")}</p>
          ) : (
            <table className="w-full table-fixed border-collapse text-left">
              <thead>
                <tr className="border-b border-subtle bg-layer-2">
                  <th className="w-[20%] px-4 py-2.5 text-11 font-medium text-secondary">
                    {t("boards.settings.fields.col_name")}
                  </th>
                  <th className="w-[20%] px-4 py-2.5 text-11 font-medium text-secondary">
                    {t("boards.settings.fields.col_type")}
                  </th>
                  <th className="w-[14%] px-4 py-2.5 text-11 font-medium text-secondary">
                    {t("boards.settings.fields.col_layout")}
                  </th>
                  <th className="w-[34%] px-4 py-2.5 text-11 font-medium text-secondary">
                    {t("boards.settings.fields.col_description")}
                  </th>
                  <th className="w-[12%] px-4 py-2.5 text-right text-11 font-medium text-secondary">
                    {t("boards.settings.fields.col_actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {filteredFields.map((item, index) => {
                  const displayName = getBoardFieldDisplayName(item, t);
                  const orderIndex = fields.findIndex((f) => f.id === item.id);
                  const layoutLabel =
                    (item.form_span ?? "half") === "full"
                      ? t("boards.settings.fields.form_span_full_short")
                      : t("boards.settings.fields.form_span_half_short");
                  return (
                    <tr key={item.id} className="group transition-colors hover:bg-layer-transparent-hover">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <div className="flex shrink-0 flex-col">
                            <button
                              type="button"
                              disabled={orderIndex <= 0}
                              onClick={() => void moveField(item, "up")}
                              className="rounded p-0.5 text-placeholder hover:bg-layer-transparent-hover disabled:opacity-30"
                              aria-label={t("boards.settings.fields.move_up")}
                            >
                              <ChevronUp className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={orderIndex < 0 || orderIndex >= fields.length - 1}
                              onClick={() => void moveField(item, "down")}
                              className="rounded p-0.5 text-placeholder hover:bg-layer-transparent-hover disabled:opacity-30"
                              aria-label={t("boards.settings.fields.move_down")}
                            >
                              <ChevronDown className="size-3.5" />
                            </button>
                          </div>
                          <p className="truncate text-body-sm-medium text-primary">{displayName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="grid size-8 shrink-0 place-items-center rounded-md border border-subtle bg-[rgba(38,132,255,0.08)]">
                            <BoardCustomFieldTypeGlyph fieldType={item.field_type} size="sm" />
                          </span>
                          <span className="truncate text-13 text-primary">
                            {t(`boards.settings.fields.types.${item.field_type}`)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-13 text-secondary">{layoutLabel}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="line-clamp-2 text-13 text-secondary">
                          {item.description?.trim() || t("boards.settings.fields.no_description")}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <CustomMenu
                          menuItemsClassName="z-30"
                          closeOnSelect
                          customButton={
                            <button
                              type="button"
                              className="inline-flex size-8 items-center justify-center rounded-md text-placeholder transition-colors hover:bg-layer-transparent-hover data-[state=open]:bg-layer-transparent-hover"
                              aria-label={t("boards.settings.fields.col_actions")}
                            >
                              <MoreHorizontal className="size-4" />
                            </button>
                          }
                        >
                          <BoardFieldLayoutMenu field={item} onSetFormSpan={(span) => void setFormSpan(item, span)} />
                          {!item.is_system && (
                            <CustomMenu.MenuItem onClick={() => setEditField(item)}>
                              {t("boards.settings.fields.edit_field")}
                            </CustomMenu.MenuItem>
                          )}
                          <CustomMenu.MenuItem onClick={() => handleRemove(item)}>
                            {t("boards.settings.fields.remove_from_board")}
                          </CustomMenu.MenuItem>
                          {!item.is_system && (
                            <CustomMenu.MenuItem
                              onClick={() => setDeleteField(item)}
                              className="text-danger"
                            >
                              {t("boards.settings.fields.delete_workspace")}
                            </CustomMenu.MenuItem>
                          )}
                        </CustomMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
      {fields.length > 0 && (
        <p className="mt-3 text-11 text-tertiary">
          {fields.length === 1
            ? t("boards.settings.fields.enabled_count_singular")
            : t("boards.settings.fields.enabled_count_plural", { count: fields.length })}
        </p>
      )}
    </div>
  );
});
