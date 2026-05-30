import { IS_FAVORITE_MENU_OPEN } from "@operis/constants";
import { useLocalStorage } from "@operis/hooks";
import { setPromiseToast } from "@operis/propel/toast";
import { useFavorite } from "@/hooks/store/use-favorite";
import { useProject } from "@/hooks/store/use-project";

export const useProjectFavorite = (workspaceSlug: string | undefined, projectId: string | undefined) => {
  const { getProjectById, addProjectToFavorites, removeProjectFromFavorites } = useProject();
  const { entityMap } = useFavorite();
  const { setValue: toggleFavoriteMenu, storedValue: isFavoriteMenuOpen } = useLocalStorage<boolean>(
    IS_FAVORITE_MENU_OPEN,
    false
  );

  const project = projectId ? getProjectById(projectId) : undefined;
  const canFavorite = !!project?.member_role && !project.archived_at;
  const isFavorite = !!project?.is_favorite || !!(projectId && entityMap[projectId]);

  const handleAddToFavorites = () => {
    if (!workspaceSlug || !projectId) return;

    const promise = addProjectToFavorites(workspaceSlug, projectId).then((result) => {
      if (!isFavoriteMenuOpen) toggleFavoriteMenu(true);
      return result;
    });
    setPromiseToast(promise, {
      loading: "Adding project to favorites...",
      success: {
        title: "Success!",
        message: () => "Project added to favorites.",
      },
      error: {
        title: "Error!",
        message: () => "Couldn't add the project to favorites. Please try again.",
      },
    });
  };

  const handleRemoveFromFavorites = () => {
    if (!workspaceSlug || !projectId) return;

    const promise = removeProjectFromFavorites(workspaceSlug, projectId);
    setPromiseToast(promise, {
      loading: "Removing project from favorites...",
      success: {
        title: "Success!",
        message: () => "Project removed from favorites.",
      },
      error: {
        title: "Error!",
        message: () => "Couldn't remove the project from favorites. Please try again.",
      },
    });
  };

  const toggleFavorite = () => {
    if (isFavorite) handleRemoveFromFavorites();
    else handleAddToFavorites();
  };

  return {
    canFavorite,
    isFavorite,
    toggleFavorite,
    handleAddToFavorites,
    handleRemoveFromFavorites,
  };
};
