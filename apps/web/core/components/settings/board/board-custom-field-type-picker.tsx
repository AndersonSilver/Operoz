/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import type { TCustomFieldType } from "@plane/types";
import { cn } from "@plane/ui";
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
                "hover:bg-layer-transparent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-primary",
                isActive && "bg-[rgba(38,132,255,0.08)] ring-2 ring-inset ring-accent-primary"
              )}
            >
              <BoardCustomFieldTypeGlyph fieldType={type} size="lg" />
              <span className="px-1 text-center text-11 font-medium leading-tight text-primary">
                {t(`boards.settings.fields.types.${type}`)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
