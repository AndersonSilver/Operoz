import { useTranslation } from "@operoz/i18n";
import type { TCustomFieldType } from "@operoz/types";
import { cn } from "@operoz/ui";
import { JIRA_CUSTOM_FIELD_TYPES } from "@/constants/board-custom-field-types";
import { BoardCustomFieldTypeGlyph } from "./board-custom-field-type-glyph";

type Props = {
  value: TCustomFieldType;
  onChange: (type: TCustomFieldType) => void;
};

export function BoardCustomFieldTypePicker(props: Props) {
  const { value, onChange } = props;
  const { t } = useTranslation();

  return (
    <div className="overflow-hidden rounded-lg border border-subtle">
      <div className="grid grid-cols-3 divide-x divide-y divide-subtle">
        {JIRA_CUSTOM_FIELD_TYPES.map((type) => {
          const isActive = value === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onChange(type)}
              className={cn(
                "flex min-h-[88px] flex-col items-center justify-center gap-2 bg-layer-2 px-2 py-4 transition-colors",
                "focus-visible:ring-accent-primary hover:bg-layer-transparent-hover focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset",
                isActive && "ring-accent-primary bg-[rgba(38,132,255,0.08)] ring-2 ring-inset"
              )}
            >
              <BoardCustomFieldTypeGlyph fieldType={type} size="lg" />
              <span className="px-1 text-center text-11 leading-tight font-medium text-primary">
                {t(`boards.settings.fields.types.${type}`)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
