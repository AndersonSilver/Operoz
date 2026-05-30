/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TModuleStatus } from "../module/modules";

/** Módulo agregado no board (resposta de GET …/boards/{slug}/modules/). */
export interface IBoardModule {
  id: string;
  workspace_id: string;
  project_id: string;
  name: string;
  start_date: string | null;
  target_date: string | null;
  status: TModuleStatus | null;
  sort_order: number;
  archived_at: string | null;
}
