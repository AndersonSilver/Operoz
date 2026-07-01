/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createContext, useContext, type ReactNode } from "react";
import type { IBoard } from "@plane/types";

export type TBoardLayoutContext = {
  board: IBoard | undefined;
  isBoardLoading: boolean;
  workspaceSlug: string;
  boardSlug: string;
};

const BoardLayoutContext = createContext<TBoardLayoutContext | null>(null);

type ProviderProps = {
  value: TBoardLayoutContext;
  children: ReactNode;
};

export function BoardLayoutProvider(props: ProviderProps) {
  const { value, children } = props;
  return <BoardLayoutContext.Provider value={value}>{children}</BoardLayoutContext.Provider>;
}

export function useBoardLayoutOptional(): TBoardLayoutContext | null {
  return useContext(BoardLayoutContext);
}

export function useBoardLayout(): TBoardLayoutContext {
  const context = useBoardLayoutOptional();
  if (!context) {
    throw new Error("useBoardLayout must be used within a board route layout");
  }
  return context;
}
