import { observer } from "mobx-react";
import { FavoriteStar } from "@operoz/ui";
import { useProjectFavorite } from "@/hooks/use-project-favorite";

type Props = {
  workspaceSlug: string | undefined;
  projectId: string;
  buttonClassName?: string;
  iconClassName?: string;
  className?: string;
};

export const ProjectFavoriteStar = observer(function ProjectFavoriteStar(props: Props) {
  const { workspaceSlug, projectId, buttonClassName, iconClassName, className } = props;
  const { canFavorite, isFavorite, toggleFavorite } = useProjectFavorite(workspaceSlug, projectId);

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
