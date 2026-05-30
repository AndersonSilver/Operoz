/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Navigate, useParams } from "react-router";
import useSWR from "swr";
import { useTranslation } from "@plane/i18n";
import { WorkspaceBoardsDirectory } from "@/components/board/workspace-boards-directory";
import { PageHead } from "@/components/core/page-title";
import { ENABLE_WORKSPACE_BOARDS } from "@/constants/enable-boards";
import { useBoard } from "@/hooks/store/use-board";
import { useFavorite } from "@/hooks/store/use-favorite";
import { useProject } from "@/hooks/store/use-project";
import { useWorkspace } from "@/hooks/store/use-workspace";
import type { Route } from "./+types/page";

function BoardsDirectoryPage(_props: Route.ComponentProps) {
  const { workspaceSlug = "" } = useParams();
  const { t } = useTranslation();
  const { currentWorkspace } = useWorkspace();
  const { fetchBoards, loader, currentWorkspaceBoardIds } = useBoard();
  const { fetchProjects } = useProject();
  const { fetchFavorite } = useFavorite();

  useSWR(
    ENABLE_WORKSPACE_BOARDS && workspaceSlug ? `WORKSPACE_BOARDS_DIRECTORY_${workspaceSlug}` : null,
    async () => {
      await Promise.all([
        fetchBoards(workspaceSlug),
        fetchProjects(workspaceSlug),
        fetchFavorite(workspaceSlug),
      ]);
    },
    { revalidateOnFocus: false }
  );

  if (!ENABLE_WORKSPACE_BOARDS) {
    return <Navigate to={`/${workspaceSlug}`} replace />;
  }

  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${t("boards.spaces_title")}`
    : t("boards.spaces_title");

  const isLoading = loader === "init-loader" && currentWorkspaceBoardIds.length === 0;

  return (
    <>
      <PageHead title={pageTitle} />
      <WorkspaceBoardsDirectory workspaceSlug={workspaceSlug} isLoading={isLoading} />
    </>
  );
}

export default observer(BoardsDirectoryPage);
