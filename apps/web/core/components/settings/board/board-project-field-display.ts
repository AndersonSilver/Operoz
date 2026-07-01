/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { IBoardProjectFieldLayout } from "@plane/types";

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export function getBoardProjectFieldDisplayName(item: IBoardProjectFieldLayout, t: TranslateFn): string {
  if (item.field_source === "system" && item.standard_field_key) {
    return t(`boards.settings.project_schema.standard_fields.${item.standard_field_key}`);
  }
  return item.name;
}
