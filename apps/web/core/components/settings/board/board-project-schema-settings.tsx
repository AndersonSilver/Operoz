import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { useTranslation } from "@operoz/i18n";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type {
  IBoardProjectFieldLayout,
  TBoardFieldFormSpan,
  TBoardProjectFieldSection,
  TProjectStandardFieldKey,
} from "@operoz/types";
import { Loader } from "@operoz/ui";
import { cn } from "@operoz/utils";
import { SettingsHeading } from "@/components/settings/heading";
import { useBoardCustomField } from "@/hooks/store/use-board-custom-field";
import { getBoardProjectFieldDisplayName } from "./board-project-field-display";
import { PROJECT_STANDARD_FIELD_KEYS } from "./board-project-schema-constants";
import { BoardProjectSchemaFieldRow } from "./board-project-schema-field-row";
import { BoardProjectSchemaFieldsSidebar } from "./board-project-schema-fields-sidebar";

type Props = {
  workspaceSlug: string;
  boardSlug: string;
  boardName: string;
};

function LayoutSectionBlock(props: {
  title: string;
  hint: string;
  section: TBoardProjectFieldSection;
  items: IBoardProjectFieldLayout[];
  isTargetSection: boolean;
  onSelectSection: () => void;
  onMove: (item: IBoardProjectFieldLayout, direction: "up" | "down") => void;
  onToggleRequired: (item: IBoardProjectFieldLayout) => void;
  onSetSpan: (item: IBoardProjectFieldLayout, span: TBoardFieldFormSpan) => void;
  onHide: (item: IBoardProjectFieldLayout) => void;
  onRemove: (item: IBoardProjectFieldLayout) => void;
}) {
  const {
    title,
    hint,
    section,
    items,
    isTargetSection,
    onSelectSection,
    onMove,
    onToggleRequired,
    onSetSpan,
    onHide,
    onRemove,
  } = props;
  const { t } = useTranslation();

  return (
    <section
      className={cn(
        "rounded-lg border bg-layer-1 transition-colors",
        isTargetSection ? "border-accent-strong" : "border-subtle"
      )}
      onFocus={onSelectSection}
    >
      <button type="button" className="w-full border-b border-subtle px-4 py-3 text-left" onClick={onSelectSection}>
        <p className="text-13 font-semibold text-primary">{title}</p>
        <p className="text-11 text-tertiary">{hint}</p>
        {isTargetSection && (
          <p className="mt-1 text-11 font-medium text-accent-primary">
            {t("boards.settings.project_schema.active_section_hint")}
          </p>
        )}
      </button>
      {items.length === 0 ? (
        <p className="px-4 py-6 text-center text-12 text-tertiary">
          {t("boards.settings.project_schema.section_empty")}
        </p>
      ) : (
        <div>
          {items.map((item, index) => (
            <BoardProjectSchemaFieldRow
              key={item.id}
              item={item}
              orderIndex={index}
              orderMax={items.length - 1}
              onMove={(direction) => onMove(item, direction)}
              onToggleRequired={() => onToggleRequired(item)}
              onSetSpan={(span) => onSetSpan(item, span)}
              onHide={() => onHide(item)}
              onRemove={() => onRemove(item)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export const BoardProjectSchemaSettings = observer(function BoardProjectSchemaSettings(props: Props) {
  const { workspaceSlug, boardSlug, boardName } = props;
  const { t } = useTranslation();
  const {
    fetchBoardProjectFieldLayout,
    getBoardProjectFieldLayout,
    getBoardCustomFields,
    fetchBoardCustomFields,
    updateBoardProjectFieldLayout,
    removeBoardProjectFieldLayout,
    addBoardProjectLayoutCustomField,
  } = useBoardCustomField();
  const [targetSection, setTargetSection] = useState<TBoardProjectFieldSection>("description");

  const { isLoading } = useSWR(
    workspaceSlug && boardSlug ? `BOARD_PROJECT_LAYOUT_${workspaceSlug}_${boardSlug}` : null,
    async () => {
      await fetchBoardCustomFields(workspaceSlug, boardSlug);
      return fetchBoardProjectFieldLayout(workspaceSlug, boardSlug);
    },
    { revalidateIfStale: false, revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const allLayout = getBoardProjectFieldLayout(workspaceSlug, boardSlug);
  const layout = [...allLayout].filter((f) => f.is_enabled).sort((a, b) => a.sort_order - b.sort_order);

  const descriptionItems = layout.filter((f) => f.section === "description");
  const contextItems = layout.filter((f) => f.section === "context");

  const enabledSystemKeys = new Set(
    layout
      .filter((f) => f.field_source === "system" && f.standard_field_key)
      .map((f) => f.standard_field_key as TProjectStandardFieldKey)
  );
  const hiddenSystemKeys = PROJECT_STANDARD_FIELD_KEYS.filter((k) => !enabledSystemKeys.has(k));

  const layoutCustomIds = useMemo(() => new Set(layout.map((f) => f.custom_field_id).filter(Boolean)), [layout]);
  const availableCustomFields = getBoardCustomFields(workspaceSlug, boardSlug).filter(
    (f) => f.is_enabled && f.custom_field_id && !layoutCustomIds.has(f.custom_field_id)
  );

  const persistOrder = async (ordered: IBoardProjectFieldLayout[]) => {
    await Promise.all(
      ordered.map((field, index) =>
        updateBoardProjectFieldLayout(workspaceSlug, boardSlug, field.id, {
          sort_order: (index + 1) * 1000,
        })
      )
    );
    await fetchBoardProjectFieldLayout(workspaceSlug, boardSlug);
  };

  const moveFieldInSection = async (
    item: IBoardProjectFieldLayout,
    direction: "up" | "down",
    sectionItems: IBoardProjectFieldLayout[]
  ) => {
    const idx = sectionItems.findIndex((f) => f.id === item.id);
    if (idx < 0) return;
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= sectionItems.length) return;
    const reorderedSection = [...sectionItems];
    const [removed] = reorderedSection.splice(idx, 1);
    reorderedSection.splice(target, 0, removed);
    const combined =
      item.section === "description"
        ? [...reorderedSection, ...contextItems]
        : [...descriptionItems, ...reorderedSection];
    await persistOrder(combined);
  };

  const toggleRequired = async (item: IBoardProjectFieldLayout) => {
    await updateBoardProjectFieldLayout(workspaceSlug, boardSlug, item.id, {
      is_required: !item.is_required,
    });
    await fetchBoardProjectFieldLayout(workspaceSlug, boardSlug);
  };

  const setFormSpan = async (item: IBoardProjectFieldLayout, formSpan: TBoardFieldFormSpan) => {
    await updateBoardProjectFieldLayout(workspaceSlug, boardSlug, item.id, { form_span: formSpan });
    await fetchBoardProjectFieldLayout(workspaceSlug, boardSlug);
  };

  const handleHide = async (item: IBoardProjectFieldLayout) => {
    try {
      await removeBoardProjectFieldLayout(workspaceSlug, boardSlug, item.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("boards.settings.project_schema.hide_success_title"),
        message: t("boards.settings.project_schema.hide_success_message", {
          name: getBoardProjectFieldDisplayName(item, t),
        }),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  const handleRemoveCustom = async (item: IBoardProjectFieldLayout) => {
    try {
      await removeBoardProjectFieldLayout(workspaceSlug, boardSlug, item.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("boards.settings.project_schema.remove_success_title"),
        message: t("boards.settings.project_schema.remove_success_message", {
          name: getBoardProjectFieldDisplayName(item, t),
        }),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  const reenableSystem = async (key: TProjectStandardFieldKey) => {
    const existing = allLayout.find((f) => f.standard_field_key === key);
    if (existing) {
      await updateBoardProjectFieldLayout(workspaceSlug, boardSlug, existing.id, {
        is_enabled: true,
        section: targetSection,
      });
    }
    await fetchBoardProjectFieldLayout(workspaceSlug, boardSlug);
    setToast({
      type: TOAST_TYPE.SUCCESS,
      title: t("boards.settings.project_schema.add_success_title"),
      message: t("boards.settings.project_schema.add_success_message"),
    });
  };

  const addCustom = async (customFieldId: string) => {
    try {
      await addBoardProjectLayoutCustomField(workspaceSlug, boardSlug, {
        custom_field_id: customFieldId,
        section: targetSection,
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("boards.settings.project_schema.add_success_title"),
        message: t("boards.settings.project_schema.add_success_message"),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  return (
    <div className="w-full">
      <SettingsHeading
        title={t("boards.settings.nav.project_schema")}
        description={t("boards.settings.project_schema.description", { board: boardName })}
      />
      <p className="mt-2 text-12 text-tertiary">{t("boards.settings.project_schema.standard_vs_custom_hint")}</p>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 space-y-4">
            <LayoutSectionBlock
              title={t("boards.settings.project_schema.section_description")}
              hint={t("boards.settings.project_schema.section_hint")}
              section="description"
              items={descriptionItems}
              isTargetSection={targetSection === "description"}
              onSelectSection={() => setTargetSection("description")}
              onMove={(item, dir) => moveFieldInSection(item, dir, descriptionItems)}
              onToggleRequired={toggleRequired}
              onSetSpan={setFormSpan}
              onHide={handleHide}
              onRemove={handleRemoveCustom}
            />
            <LayoutSectionBlock
              title={t("boards.settings.project_schema.section_context")}
              hint={t("boards.settings.project_schema.section_hint")}
              section="context"
              items={contextItems}
              isTargetSection={targetSection === "context"}
              onSelectSection={() => setTargetSection("context")}
              onMove={(item, dir) => moveFieldInSection(item, dir, contextItems)}
              onToggleRequired={toggleRequired}
              onSetSpan={setFormSpan}
              onHide={handleHide}
              onRemove={handleRemoveCustom}
            />
          </div>
          <BoardProjectSchemaFieldsSidebar
            workspaceSlug={workspaceSlug}
            boardSlug={boardSlug}
            targetSection={targetSection}
            availableCustomFields={availableCustomFields}
            hiddenSystemKeys={hiddenSystemKeys}
            onAddSystem={reenableSystem}
            onAddCustom={addCustom}
          />
        </div>
      )}
    </div>
  );
});
