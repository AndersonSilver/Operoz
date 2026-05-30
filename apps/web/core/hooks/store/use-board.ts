/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import type { IBoardStore } from "@/store/board/board.store";

export const useBoard = (): IBoardStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useBoard must be used within StoreProvider");
  return context.boardStore;
};
