/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TCustomFieldType } from "@plane/types";
import { cn } from "@plane/ui";
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
