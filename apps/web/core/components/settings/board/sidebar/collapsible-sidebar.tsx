import { observer } from "mobx-react";
import type { IBoard } from "@operis/types";
import { AuxiliaryCollapsibleSidebar } from "@/components/sidebar/auxiliary-collapsible-sidebar";
import { SETTINGS_SIDEBAR_WIDTH } from "@/constants/collapsible-sidebar";
import { BoardSettingsSidebarRoot } from "./root";

type Props = {
  workspaceSlug: string;
  board: IBoard;
  className?: string;
  isMobile?: boolean;
};

export const BoardSettingsCollapsibleSidebar = observer(function BoardSettingsCollapsibleSidebar(props: Props) {
  const { workspaceSlug, board, className, isMobile } = props;

  return (
    <AuxiliaryCollapsibleSidebar
      storageKey="board_settings_sidebar_pinned"
      width={SETTINGS_SIDEBAR_WIDTH}
      className={className}
      isMobile={isMobile}
      mobileFallback={
        <BoardSettingsSidebarRoot workspaceSlug={workspaceSlug} board={board} className={className} isMobile />
      }
    >
      <BoardSettingsSidebarRoot workspaceSlug={workspaceSlug} board={board} className="h-full border-r-0" />
    </AuxiliaryCollapsibleSidebar>
  );
});
