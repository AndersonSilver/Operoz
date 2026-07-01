/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { IBoardCustomField } from "@plane/types";

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export function getBoardFieldDisplayName(item: IBoardCustomField, t: TranslateFn): string {
  if (item.is_system && item.standard_field_key) {
    return t(`boards.settings.fields.standard_fields.${item.standard_field_key}`);
  }
  return item.name;
}
