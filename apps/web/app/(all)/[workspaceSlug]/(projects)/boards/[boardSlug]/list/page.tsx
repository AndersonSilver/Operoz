/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "@plane/i18n";
import { useBoardLayout } from "@/components/board/board-layout-context";
import { BoardListLayoutRoot } from "@/components/board/board-list-layout-root";
import { PageHead } from "@/components/core/page-title";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { useWorkspace } from "@/hooks/store/use-workspace";
import type { Route } from "./+types/page";

export default function BoardListPage(_props: Route.ComponentProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const { board, isBoardLoading, workspaceSlug, boardSlug } = useBoardLayout();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isBoardLoading || board) return;
    navigate(`/${workspaceSlug}/boards/${boardSlug}`, { replace: true });
  }, [board, boardSlug, isBoardLoading, navigate, workspaceSlug]);

  if (isBoardLoading && !board) {
    return (
      <>
        <PageHead title={t("boards.list_title")} />
        <div className="flex h-full items-center justify-center">
          <LogoSpinner />
        </div>
      </>
    );
  }

  if (!board) {
    return null;
  }

  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${board.name} - ${t("boards.tab_list")}`
    : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <BoardListLayoutRoot isLoading={isLoading} toggleLoading={setIsLoading} />
    </>
  );
}
