/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/** Liga a sidebar hierárquica Boards → Projetos (Etapa 2+). Definir VITE_ENABLE_BOARDS=true no .env local. */
export const ENABLE_WORKSPACE_BOARDS =
  process.env.VITE_ENABLE_BOARDS === "true" || process.env.VITE_ENABLE_BOARDS === "1";
