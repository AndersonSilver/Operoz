/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TCustomFieldType } from "@plane/types";

/** Ordem e tipos do picker de criar campo no workspace. */
export const JIRA_CUSTOM_FIELD_TYPES: TCustomFieldType[] = [
  "text",
  "paragraph",
  "date",
  "number",
  "datetime",
  "categories",
  "select",
  "checkbox",
  "member",
  "multi_select",
  "url",
];

export const fieldTypeNeedsOptions = (fieldType: TCustomFieldType): boolean =>
  fieldType === "select" || fieldType === "multi_select" || fieldType === "categories";
