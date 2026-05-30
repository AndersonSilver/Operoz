/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TProjectStandardFieldKey } from "@plane/types";

/** Campos de sistema do Projeto — criados automaticamente; não se apagam, só ocultam. */
export const PROJECT_STANDARD_FIELD_KEYS: TProjectStandardFieldKey[] = [
  "name",
  "identifier",
  "description",
  "project_lead",
  "responsible_stakeholder",
  "default_assignee",
  "network",
  "timezone",
];

export function isProjectStandardLayoutField(fieldSource: string) {
  return fieldSource === "system";
}
