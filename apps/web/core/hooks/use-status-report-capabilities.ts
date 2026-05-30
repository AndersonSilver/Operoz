import { useCallback } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { EUserPermissions, EUserPermissionsLevel } from "@operis/constants";
import { useBoardPermissions } from "@/hooks/store/use-board-permissions";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { projectBoardPermissionsKey } from "@/utils/board-permissions";

export function useStatusReportCapabilities(projectId: string | undefined) {
  const { workspaceSlug } = useParams();
  const workspaceSlugStr = workspaceSlug?.toString();
  const { allowPermissions } = useUserPermissions();
  const { getProjectById } = useProject();
  const { fetchProjectBoardPermissions, canBoardPermission } = useBoardPermissions();

  const project = projectId ? getProjectById(projectId) : undefined;
  const hasBoard = Boolean(project?.board_id);

  const isProjectMember = Boolean(
    projectId &&
      workspaceSlugStr &&
      allowPermissions(
        [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
        EUserPermissionsLevel.PROJECT,
        workspaceSlugStr,
        projectId
      )
  );

  const isProjectAdmin = Boolean(
    projectId &&
      workspaceSlugStr &&
      allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT, workspaceSlugStr, projectId)
  );

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

  const hasBoardPermission = useCallback(
    (permissionKey: string) => {
      if (!workspaceSlugStr || !projectId || !hasBoard) return false;
      return canBoardPermission(workspaceSlugStr, projectId, permissionKey);
    },
    [canBoardPermission, hasBoard, projectId, workspaceSlugStr]
  );

  const canManage = useCallback(() => {
    if (!isProjectMember) return false;
    if (!hasBoard) return isProjectAdmin;
    return hasBoardPermission("status_reports.manage");
  }, [hasBoard, hasBoardPermission, isProjectAdmin, isProjectMember]);

  const canDelete = useCallback(() => {
    if (!isProjectMember) return false;
    if (!hasBoard) return isProjectAdmin;
    return hasBoardPermission("status_reports.delete");
  }, [hasBoard, hasBoardPermission, isProjectAdmin, isProjectMember]);

  return { canManage, canDelete, isProjectAdmin, isProjectMember };
}
