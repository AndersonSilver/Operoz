import type { IProjectBoardPermissions } from "@operis/types";

export const boardPermissionGranted = (permissions: string[], permissionKey: string): boolean => {
  if (permissions.includes("board.administer")) return true;
  return permissions.includes(permissionKey);
};

export const canPerformBoardPermission = (
  snapshot: IProjectBoardPermissions | undefined,
  permissionKey: string
): boolean => {
  if (!snapshot) return true;
  if (!snapshot.enforced) return true;
  return boardPermissionGranted(snapshot.permissions, permissionKey);
};

export const projectBoardPermissionsKey = (workspaceSlug: string, projectId: string) =>
  `PROJECT_BOARD_PERMISSIONS_${workspaceSlug}_${projectId}`;
