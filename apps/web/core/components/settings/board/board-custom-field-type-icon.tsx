import type { TCustomFieldType } from "@operis/types";
import { cn } from "@operis/ui";
import { BoardCustomFieldTypeGlyph } from "./board-custom-field-type-glyph";

type Props = {
  fieldType: TCustomFieldType;
  size?: "sm" | "md";
  className?: string;
};

export function BoardCustomFieldTypeIcon(props: Props) {
  const { fieldType, size = "md", className } = props;
  const box = size === "sm" ? "size-8" : "size-9";

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-md border border-subtle bg-[rgba(38,132,255,0.08)]",
        box,
        className
      )}
    >
      <BoardCustomFieldTypeGlyph fieldType={fieldType} size={size === "sm" ? "sm" : "md"} />
    </span>
  );
}

export function getFieldTypeMeta(fieldType: TCustomFieldType) {
  return { fieldType };
}
