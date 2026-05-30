import { observer } from "mobx-react";
import { useBoard } from "@/hooks/store/use-board";
import { WorkspaceBoardsSettingsListItem } from "./workspace-boards-settings-list-item";

type Props = {
  workspaceSlug: string;
};

export const WorkspaceBoardsSettingsList = observer(function WorkspaceBoardsSettingsList(props: Props) {
  const { workspaceSlug } = props;
  const { currentWorkspaceAllBoardIds, getBoardById } = useBoard();

  return (
    <div className="mt-4 flex flex-col gap-2">
      {currentWorkspaceAllBoardIds.map((boardId) => {
        const board = getBoardById(boardId);
        if (!board) return null;
        return <WorkspaceBoardsSettingsListItem key={board.id} workspaceSlug={workspaceSlug} board={board} />;
      })}
    </div>
  );
});
