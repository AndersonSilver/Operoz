import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Check, ChevronLeft, Plus, Search } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import { Button } from "@operis/propel/button";
import type { IWorkspaceCustomField, TCustomFieldType } from "@operis/types";
import { cn } from "@operis/utils";
import { Input } from "@operis/ui";
import { useBoardCustomField } from "@/hooks/store/use-board-custom-field";
import { BoardCustomFieldCreateForm } from "./board-custom-field-create-form";
import { getBoardFieldDisplayName } from "./board-field-display";
import { BoardCustomFieldTypeGlyph } from "./board-custom-field-type-glyph";
import { SettingsSidePanel } from "./settings-side-panel";

type PanelView = "list" | "create";

type Props = {
  workspaceSlug: string;
  boardSlug: string;
  boardName: string;
  isOpen: boolean;
  onClose: () => void;
  preselectFieldId?: string | null;
};

type AddableFieldItem = {
  id: string;
  kind: "standard" | "workspace";
  name: string;
  description?: string;
  field_type: TCustomFieldType;
};

export const BoardCustomFieldAddModal = observer(function BoardCustomFieldAddModal(props: Props) {
  const { workspaceSlug, boardSlug, boardName, isOpen, onClose, preselectFieldId } = props;
  const { t } = useTranslation();
  const {
    getBoardCustomFields,
    getWorkspaceCustomFields,
    bulkAddBoardCustomFields,
    updateBoardCustomField,
    fetchWorkspaceCustomFields,
    fetchBoardCustomFields,
  } = useBoardCustomField();
  const [view, setView] = useState<PanelView>("list");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const boardFieldsAll = getBoardCustomFields(workspaceSlug, boardSlug);
  const boardFieldsEnabled = boardFieldsAll.filter((f) => f.is_enabled);
  const workspaceFields = getWorkspaceCustomFields(workspaceSlug);
  const onBoardCustomIds = new Set(
    boardFieldsEnabled.map((f) => f.custom_field_id).filter((id): id is string => Boolean(id))
  );

  const q = search.trim().toLowerCase();
  const available: AddableFieldItem[] = [];

  boardFieldsAll
    .filter((f) => f.is_system && !f.is_enabled)
    .forEach((f) => {
      available.push({
        id: f.id,
        kind: "standard",
        name: getBoardFieldDisplayName(f, t),
        field_type: f.field_type,
      });
    });

  workspaceFields
    .filter((f) => f.is_active && !onBoardCustomIds.has(f.id))
    .forEach((f) => {
      available.push({
        id: f.id,
        kind: "workspace",
        name: f.name,
        description: f.description,
        field_type: f.field_type,
      });
    });

  const filteredAvailable = available
    .filter((item) => {
      if (!q) return true;
      const typeLabel = t(`boards.settings.fields.types.${item.field_type}`).toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description ?? "").toLowerCase().includes(q) ||
        typeLabel.includes(q)
      );
    })
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "standard" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleClose = () => {
    setView("list");
    setSearch("");
    setSelected(new Set());
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      setView("list");
      setSearch("");
      setSelected(new Set());
      return;
    }
    void fetchWorkspaceCustomFields(workspaceSlug);
    void fetchBoardCustomFields(workspaceSlug, boardSlug);
  }, [isOpen, workspaceSlug, boardSlug, fetchWorkspaceCustomFields, fetchBoardCustomFields]);

  useEffect(() => {
    if (!isOpen || !preselectFieldId) return;
    const alreadyOnBoard = boardFieldsEnabled.some((f) => f.custom_field_id === preselectFieldId);
    if (alreadyOnBoard) return;
    setSelected((prev) => {
      if (prev.has(preselectFieldId)) return prev;
      return new Set([...prev, preselectFieldId]);
    });
  }, [isOpen, preselectFieldId, boardFieldsEnabled]);

  const onConfirm = async () => {
    if (selected.size === 0) return;
    setIsSubmitting(true);
    try {
      const standardBoardFieldIds = boardFieldsAll
        .filter((f) => f.is_system && selected.has(f.id))
        .map((f) => f.id);
      const workspaceCustomFieldIds = Array.from(selected).filter(
        (id) => !standardBoardFieldIds.includes(id)
      );

      await Promise.all(
        standardBoardFieldIds.map((boardFieldId) =>
          updateBoardCustomField(workspaceSlug, boardSlug, boardFieldId, { is_enabled: true })
        )
      );

      let addedCount = standardBoardFieldIds.length;
      if (workspaceCustomFieldIds.length > 0) {
        const added = await bulkAddBoardCustomFields(workspaceSlug, boardSlug, workspaceCustomFieldIds);
        addedCount += added.length;
      }

      if (addedCount === 0) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: t("boards.settings.fields.already_on_board"),
        });
        return;
      }
      await fetchBoardCustomFields(workspaceSlug, boardSlug);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("boards.settings.fields.add_success_title"),
        message: t("boards.settings.fields.add_success_message", { count: addedCount }),
      });
      handleClose();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldCreated = async (field: IWorkspaceCustomField) => {
    await fetchWorkspaceCustomFields(workspaceSlug);
    setSelected((prev) => new Set([...prev, field.id]));
    setView("list");
  };

  const addButtonLabel =
    selected.size === 1
      ? t("boards.settings.fields.add_fields_count_one")
      : t("boards.settings.fields.add_fields_count_plural", { count: selected.size });

  const listFooter = (
    <div className="shrink-0 border-t border-subtle">
      <div className="px-5 py-3">
        <button
          type="button"
          onClick={() => setView("create")}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-subtle py-2.5 text-13 font-medium text-accent-primary transition-colors hover:border-strong hover:bg-layer-transparent-hover"
        >
          <Plus className="size-4" />
          {t("boards.settings.fields.create_new")}
        </button>
      </div>
      <div className="flex items-center justify-end gap-2 px-5 py-4">
        <Button variant="secondary" size="sm" type="button" onClick={handleClose}>
          {t("cancel")}
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={onConfirm}
          loading={isSubmitting}
          disabled={selected.size === 0}
        >
          {selected.size > 0 ? addButtonLabel : t("boards.settings.fields.add_selected")}
        </Button>
      </div>
    </div>
  );

  return (
    <SettingsSidePanel
      isOpen={isOpen}
      onClose={handleClose}
      title={
        view === "list"
          ? t("boards.settings.fields.add_to_board_title", { boardName })
          : t("boards.settings.fields.create_workspace_title")
      }
      description={
        view === "list"
          ? t("boards.settings.fields.add_panel_description")
          : t("boards.settings.fields.create_workspace_hint")
      }
      headerStart={
        view === "create" ? (
          <button
            type="button"
            onClick={() => setView("list")}
            className="shrink-0 rounded p-1.5 text-placeholder transition-colors hover:bg-layer-transparent-hover"
            aria-label={t("back")}
          >
            <ChevronLeft className="size-4" />
          </button>
        ) : undefined
      }
      footer={view === "list" ? listFooter : undefined}
    >
      {view === "list" ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 px-5 py-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-placeholder" />
              <Input
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("boards.settings.fields.search_placeholder")}
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
            {filteredAvailable.length === 0 ? (
              <p className="py-12 text-center text-13 text-tertiary">{t("boards.settings.fields.add_empty")}</p>
            ) : (
              <ul className="divide-y divide-subtle rounded-lg border border-subtle">
                {filteredAvailable.map((field) => {
                  const isItemSelected = selected.has(field.id);
                  return (
                    <li key={`${field.kind}-${field.id}`}>
                      <button
                        type="button"
                        onClick={() => toggle(field.id)}
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-3 text-left transition-colors",
                          isItemSelected
                            ? "bg-[rgba(38,132,255,0.12)] hover:bg-[rgba(38,132,255,0.16)]"
                            : "hover:bg-layer-transparent-hover"
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-4 shrink-0 place-items-center rounded border",
                            isItemSelected
                              ? "border-accent-primary bg-accent-primary text-on-color"
                              : "border-subtle bg-layer-2"
                          )}
                        >
                          {isItemSelected && <Check className="size-2.5" strokeWidth={3} />}
                        </span>
                        <span className="grid size-8 shrink-0 place-items-center rounded-md border border-subtle bg-[rgba(38,132,255,0.08)]">
                          <BoardCustomFieldTypeGlyph fieldType={field.field_type} size="sm" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-13 font-medium text-primary">{field.name}</p>
                          {field.description ? (
                            <p className="truncate text-11 text-tertiary">{field.description}</p>
                          ) : (
                            <p className="text-11 text-tertiary">
                              {t(`boards.settings.fields.types.${field.field_type}`)}
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <BoardCustomFieldCreateForm
          workspaceSlug={workspaceSlug}
          onCancel={() => setView("list")}
          onCreated={handleFieldCreated}
        />
      )}
    </SettingsSidePanel>
  );
});
