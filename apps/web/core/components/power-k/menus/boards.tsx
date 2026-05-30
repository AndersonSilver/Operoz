import { Logo } from "@operis/propel/emoji-icon-picker";
import type { IBoard } from "@operis/types";
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
