import { observer } from "mobx-react";
import { FavoriteStar } from "@operoz/ui";
import { useBoardFavorite } from "@/hooks/use-board-favorite";

type Props = {
  workspaceSlug: string | undefined;
  boardId: string;
  buttonClassName?: string;
  iconClassName?: string;
  className?: string;
};

export const BoardFavoriteStar = observer(function BoardFavoriteStar(props: Props) {
  const { workspaceSlug, boardId, buttonClassName, iconClassName, className } = props;
  const { canFavorite, isFavorite, toggleFavorite } = useBoardFavorite(workspaceSlug, boardId);

  if (!canFavorite) return null;

  return (
    <span className={className}>
      <FavoriteStar
        buttonClassName={buttonClassName}
        iconClassName={iconClassName}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFavorite();
        }}
        selected={isFavorite}
      />
    </span>
  );
});
