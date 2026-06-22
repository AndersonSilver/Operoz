import { useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { EUserPermissions, EUserPermissionsLevel } from "@operis/constants";
import { useBoardPermissions } from "@/hooks/store/use-board-permissions";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { projectBoardPermissionsKey } from "@/utils/board-permissions";

/**
 * Capabilities for the project sustentação (support ticket) hub.
 * - Triagem (accept/decline/snooze): project admin or member
 * - Delete: workspace admin or board.administer only
 */
export function useSupportTicketCapabilities(projectId: string | undefined) {
  const { workspaceSlug } = useParams();
  const workspaceSlugStr = workspaceSlug?.toString();
  const { allowPermissions } = useUserPermissions();
  const { getProjectById } = useProject();
  const { fetchProjectBoardPermissions, canBoardPermission } = useBoardPermissions();

  const project = projectId ? getProjectById(projectId) : undefined;
  const hasBoard = Boolean(project?.board_id);

  useSWR(
    workspaceSlugStr && projectId && hasBoard ? projectBoardPermissionsKey(workspaceSlugStr, projectId) : null,
    () => fetchProjectBoardPermissions(workspaceSlugStr!, projectId!),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    }
  );

  const isTriager = useMemo(
    () =>
      Boolean(projectId && workspaceSlugStr) &&
      allowPermissions(
        [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
        EUserPermissionsLevel.PROJECT,
        workspaceSlugStr,
        projectId
      ),
    [allowPermissions, projectId, workspaceSlugStr]
  );

  const isWorkspaceAdmin = useMemo(
    () =>
      Boolean(workspaceSlugStr) &&
      allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE, workspaceSlugStr),
    [allowPermissions, workspaceSlugStr]
  );

  const canDeleteSupportTicket = useCallback(() => {
    if (!workspaceSlugStr || !projectId) return false;
    if (isWorkspaceAdmin) return true;
    if (!hasBoard) return false;
    return canBoardPermission(workspaceSlugStr, projectId, "board.administer");
  }, [canBoardPermission, hasBoard, isWorkspaceAdmin, projectId, workspaceSlugStr]);

  return {
    isTriager,
    canDeleteSupportTicket: canDeleteSupportTicket(),
  };
}
