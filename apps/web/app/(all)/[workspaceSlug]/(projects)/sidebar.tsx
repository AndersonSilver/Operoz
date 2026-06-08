import { isEmpty } from "lodash-es";
import { observer } from "mobx-react";
import { EUserPermissions, EUserPermissionsLevel } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
// components
import { SidebarWrapper } from "@/components/sidebar/sidebar-wrapper";
import { SidebarFavoritesMenu } from "@/components/workspace/sidebar/favorites/favorites-menu";
import { SidebarBoardsList } from "@/components/workspace/sidebar/boards-list";
import { SidebarProjectsList } from "@/components/workspace/sidebar/projects-list";
import { SidebarQuickActions } from "@/components/workspace/sidebar/quick-actions";
import { SidebarMenuItems } from "@/components/workspace/sidebar/sidebar-menu-items";
import { ENABLE_WORKSPACE_BOARDS } from "@/constants/enable-boards";
// hooks
import { useFavorite } from "@/hooks/store/use-favorite";
import { useUserPermissions } from "@/hooks/store/user";
// plane web components
import { SidebarTeamsList } from "@/plane-web/components/workspace/sidebar/teams-sidebar-list";

export const AppSidebar = observer(function AppSidebar() {
  const { t } = useTranslation();
  const { allowPermissions } = useUserPermissions();
  const { groupedFavorites } = useFavorite();

  // derived values
  const canPerformWorkspaceMemberActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const isFavoriteEmpty = isEmpty(groupedFavorites);

  return (
    <SidebarWrapper title={t("sidebar.projects")} quickActions={<SidebarQuickActions />}>
      <SidebarMenuItems />
      {/* Favorites Menu */}
      {canPerformWorkspaceMemberActions && !isFavoriteEmpty && <SidebarFavoritesMenu />}
      {/* Teams List — oculto quando boards mock está ativo */}
      {!ENABLE_WORKSPACE_BOARDS && <SidebarTeamsList />}
      {/* Boards (mock) ou Projects List */}
      {ENABLE_WORKSPACE_BOARDS ? <SidebarBoardsList /> : <SidebarProjectsList />}
    </SidebarWrapper>
  );
});
