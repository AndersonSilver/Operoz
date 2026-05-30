import { observer } from "mobx-react";
import type { IBoard } from "@operis/types";
import { Spinner } from "@operis/ui";
import { PowerKBoardsMenu } from "@/components/power-k/menus/boards";
import { useBoard } from "@/hooks/store/use-board";

type Props = {
  handleSelect: (board: IBoard) => void;
};

export const PowerKOpenBoardMenu = observer(function PowerKOpenBoardMenu(props: Props) {
  const { handleSelect } = props;
  const { loader, currentWorkspaceBoardIds, getBoardById } = useBoard();

  const boardsList = currentWorkspaceBoardIds
    .map((id) => getBoardById(id))
    .filter((board): board is IBoard => board !== undefined);

  if (loader === "init-loader") return <Spinner />;

  return <PowerKBoardsMenu boards={boardsList} onSelect={handleSelect} />;
});
