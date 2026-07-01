/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useBoardPermissions } from "@/hooks/store/use-board-permissions";
import { useProject } from "@/hooks/store/use-project";
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { projectBoardPermissionsKey } from "@/utils/board-permissions";

type TUseBoardIssueCapabilitiesOptions = {
  readOnly?: boolean;
};

export function useBoardIssueCapabilities(
  projectId: string | undefined,
  options: TUseBoardIssueCapabilitiesOptions = {}
) {
  const { readOnly = false } = options;
  const { workspaceSlug } = useParams();
  const workspaceSlugStr = workspaceSlug?.toString();
  const { allowPermissions } = useUserPermissions();
  const { getProjectById } = useProject();
  const { data: currentUser } = useUser();
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

  const isProjectEditor =
    Boolean(projectId && workspaceSlugStr) &&
    allowPermissions(
      [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
      EUserPermissionsLevel.PROJECT,
      workspaceSlugStr,
      projectId
    );

  const can = useCallback(
    (permissionKey: string) => {
      if (!isProjectEditor || readOnly) return false;
      if (!workspaceSlugStr || !projectId) return false;
      if (!hasBoard) return true;
      return canBoardPermission(workspaceSlugStr, projectId, permissionKey);
    },
    [canBoardPermission, hasBoard, isProjectEditor, projectId, readOnly, workspaceSlugStr]
  );

  const canDeleteComment = useCallback(
    (authorId: string | undefined) => {
      if (!authorId || !currentUser?.id) return false;
      if (authorId === currentUser.id) return can("items.comments.delete_own");
      return can("items.comments.delete_any");
    },
    [can, currentUser?.id]
  );

  const canEditComment = useCallback(
    (authorId: string | undefined) => {
      if (!authorId || !currentUser?.id) return false;
      if (authorId === currentUser.id) return can("items.comments.edit_own");
      return can("items.comments.edit_any");
    },
    [can, currentUser?.id]
  );

  return {
    isProjectEditor,
    isEditingAllowed: can("items.edit"),
    isDeletingAllowed: can("items.delete"),
    isCreatingAllowed: can("items.create"),
    canAssign: can("items.assign"),
    canTransition: can("items.transition"),
    canCommentAdd: can("items.comments.add"),
    canDeleteComment,
    canEditComment,
    can,
  };
}

/** Para layouts com vários projetos (board hub): verifica permissão por projectId. */
export function useCanEditIssueOnProject() {
  const { workspaceSlug } = useParams();
  const workspaceSlugStr = workspaceSlug?.toString();
  const { allowPermissions } = useUserPermissions();
  const { getProjectById } = useProject();
  const { canBoardPermission } = useBoardPermissions();

  return useCallback(
    (projectId: string | undefined) => {
      if (!projectId || !workspaceSlugStr) return false;
      if (
        !allowPermissions(
          [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
          EUserPermissionsLevel.PROJECT,
          workspaceSlugStr,
          projectId
        )
      ) {
        return false;
      }
      const project = getProjectById(projectId);
      if (!project?.board_id) return true;
      return canBoardPermission(workspaceSlugStr, projectId, "items.edit");
    },
    [allowPermissions, canBoardPermission, getProjectById, workspaceSlugStr]
  );
}

/** Carrega permissões de board uma vez por projeto (evita loop no Gantt/lista). */
export function usePrefetchBoardProjectPermissions(
  workspaceSlug: string | undefined,
  projectIds: string[]
) {
  const { fetchProjectBoardPermissions } = useBoardPermissions();
  const { getProjectById } = useProject();

  const projectIdsKey = projectIds.slice().sort().join(",");

  useEffect(() => {
    if (!workspaceSlug) return;

    for (const projectId of projectIds) {
      const project = getProjectById(projectId);
      if (project?.board_id) {
        void fetchProjectBoardPermissions(workspaceSlug, projectId);
      }
    }
    // projectIdsKey stabilizes the effect; projectIds content is encoded in the key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug, projectIdsKey, fetchProjectBoardPermissions, getProjectById]);
}
