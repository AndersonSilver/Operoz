/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { IProjectBoardPermissions } from "@plane/types";

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
