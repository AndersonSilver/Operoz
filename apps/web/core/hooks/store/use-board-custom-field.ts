/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import { BoardCustomFieldStore, type IBoardCustomFieldStore } from "@/store/board/board-custom-field.store";

export const useBoardCustomField = (): IBoardCustomFieldStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useBoardCustomField must be used within StoreProvider");
  if (!context.boardCustomFieldStore) {
    context.boardCustomFieldStore = new BoardCustomFieldStore();
  }
  return context.boardCustomFieldStore;
};
