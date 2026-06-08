import { observer } from "mobx-react";
import { ScrollArea } from "@operis/propel/scrollarea";
import type { IBoard } from "@operis/types";
import { cn } from "@operis/utils";
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
      rootClassName={cn(
        "h-full w-[250px] shrink-0 animate-fade-in overflow-y-auto border-r border-subtle bg-canvas",
        className
      )}
      viewportClassName="flex flex-col pb-3"
    >
      <BoardSettingsSidebarHeader workspaceSlug={workspaceSlug} board={board} />
      <BoardSettingsSidebarItemList />
    </ScrollArea>
  );
});
