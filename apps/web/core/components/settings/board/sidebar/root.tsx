/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { ScrollArea } from "@plane/propel/scrollarea";
import type { IBoard } from "@plane/types";
import { BoardSettingsSidebarHeader } from "./header";
import { BoardSettingsSidebarItemList } from "./item-list";

type Props = {
  workspaceSlug: string;
  board: IBoard;
  className?: string;
  isMobile?: boolean;
};

export const BoardSettingsSidebarRoot = observer(function BoardSettingsSidebarRoot(props: Props) {
  const { workspaceSlug, board, className } = props;

  return (
    <ScrollArea
      scrollType="hover"
      orientation="vertical"
      size="sm"
      rootClassName={className ?? "shrink-0 animate-fade-in h-full w-[250px] bg-surface-1 border-r border-r-subtle overflow-y-scroll"}
      viewportClassName="pb-5"
    >
      <BoardSettingsSidebarHeader workspaceSlug={workspaceSlug} board={board} />
      <BoardSettingsSidebarItemList />
    </ScrollArea>
  );
});
