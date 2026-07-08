import { ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import type { IBoardProjectFieldLayout, TBoardFieldFormSpan } from "@operoz/types";
import { CustomMenu, ToggleSwitch } from "@operoz/ui";
import { cn } from "@operoz/utils";
import { BoardCustomFieldTypeGlyph } from "./board-custom-field-type-glyph";
import { getBoardProjectFieldDisplayName } from "./board-project-field-display";
import { isProjectStandardLayoutField } from "./board-project-schema-constants";

type Props = {
  item: IBoardProjectFieldLayout;
  orderIndex: number;
  orderMax: number;
  onMove: (direction: "up" | "down") => void;
  onToggleRequired: () => void;
  onSetSpan: (span: TBoardFieldFormSpan) => void;
  onHide: () => void;
  onRemove: () => void;
};

export function BoardProjectSchemaFieldRow(props: Props) {
  const { item, orderIndex, orderMax, onMove, onToggleRequired, onSetSpan, onHide, onRemove } = props;
  const { t } = useTranslation();
  const isStandard = isProjectStandardLayoutField(item.field_source);
  const canToggleRequired = item.standard_field_key !== "name";
  const canHide = isStandard && item.standard_field_key !== "name";

  return (
    <div className="group flex items-center gap-2 border-b border-subtle px-3 py-2.5 last:border-b-0 hover:bg-layer-transparent-hover">
      <div className="flex shrink-0 flex-col opacity-60 group-hover:opacity-100">
        <button
          type="button"
          disabled={orderIndex <= 0}
          onClick={() => onMove("up")}
          className="rounded p-0.5 text-placeholder hover:bg-layer-transparent-hover disabled:opacity-30"
          aria-label={t("boards.settings.fields.move_up")}
        >
          <ChevronUp className="size-3.5" />
        </button>
        <button
          type="button"
          disabled={orderIndex >= orderMax}
          onClick={() => onMove("down")}
          className="rounded p-0.5 text-placeholder hover:bg-layer-transparent-hover disabled:opacity-30"
          aria-label={t("boards.settings.fields.move_down")}
        >
          <ChevronDown className="size-3.5" />
        </button>
      </div>
      <BoardCustomFieldTypeGlyph
        fieldType={isStandard ? "standard" : (item.field_type as import("@operoz/types").TCustomFieldType)}
        size="sm"
      />
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <span className="truncate text-13 font-medium text-primary">{getBoardProjectFieldDisplayName(item, t)}</span>
        {isStandard && (
          <span className="shrink-0 rounded bg-layer-2 px-1.5 py-0.5 text-10 font-medium tracking-wide text-secondary uppercase">
            {t("boards.settings.project_schema.standard_badge")}
          </span>
        )}
        {item.is_required && (
          <span className="shrink-0 rounded bg-accent-primary/15 px-1.5 py-0.5 text-10 font-semibold tracking-wide text-accent-primary uppercase">
            {t("boards.settings.project_schema.required_badge")}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {canToggleRequired ? (
          <ToggleSwitch value={item.is_required} onChange={onToggleRequired} size="sm" />
        ) : (
          <span className="text-11 text-tertiary">{t("boards.settings.project_schema.always_required")}</span>
        )}
        <CustomMenu
          menuItemsClassName="z-30"
          closeOnSelect
          customButton={
            <button
              type="button"
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-md text-placeholder",
                "hover:bg-layer-transparent-hover"
              )}
              aria-label={t("boards.settings.fields.col_actions")}
            >
              <MoreHorizontal className="size-4" />
            </button>
          }
        >
          <CustomMenu.MenuItem onClick={() => onSetSpan("half")}>
            {(item.form_span ?? "half") === "half" ? "✓ " : ""}
            {t("boards.settings.fields.form_span_half")}
          </CustomMenu.MenuItem>
          <CustomMenu.MenuItem onClick={() => onSetSpan("full")}>
            {(item.form_span ?? "half") === "full" ? "✓ " : ""}
            {t("boards.settings.fields.form_span_full")}
          </CustomMenu.MenuItem>
          {canHide && (
            <CustomMenu.MenuItem onClick={onHide}>{t("boards.settings.project_schema.hide_field")}</CustomMenu.MenuItem>
          )}
          {!isStandard && (
            <CustomMenu.MenuItem onClick={onRemove}>
              {t("boards.settings.project_schema.remove_from_layout")}
            </CustomMenu.MenuItem>
          )}
        </CustomMenu>
      </div>
    </div>
  );
}
