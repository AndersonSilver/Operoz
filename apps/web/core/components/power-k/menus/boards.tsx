/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Logo } from "@plane/propel/emoji-icon-picker";
import type { IBoard } from "@plane/types";
import { PowerKMenuBuilder } from "./builder";

type Props = {
  boards: IBoard[];
  onSelect: (board: IBoard) => void;
};

export function PowerKBoardsMenu({ boards, onSelect }: Props) {
  return (
    <PowerKMenuBuilder
      items={boards}
      getKey={(board) => board.id}
      getIconNode={(board) => (
        <span className="shrink-0">
          <Logo logo={board.logo_props} size={14} />
        </span>
      )}
      getValue={(board) => board.name}
      getLabel={(board) => board.name}
      onSelect={onSelect}
      emptyText="No boards found"
    />
  );
}
