/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import type { IBoardPermissionsStore } from "@/store/board/board-permissions.store";

export const useBoardPermissions = (): IBoardPermissionsStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useBoardPermissions must be used within StoreProvider");
  return context.boardPermissionsStore;
};
