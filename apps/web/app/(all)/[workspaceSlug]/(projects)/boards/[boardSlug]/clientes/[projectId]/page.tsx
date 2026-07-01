/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { useBoardLayout } from "@/components/board/board-layout-context";
import { BoardClient360Detail } from "@/components/board/client-360/board-client-360-detail";
import { PageHead } from "@/components/core/page-title";
import { LogoSpinner } from "@/components/common/logo-spinner";
import type { Route } from "./+types/page";

function BoardClienteDetailPage(_props: Route.ComponentProps) {
  const { t } = useTranslation();
  const { projectId = "" } = useParams();
  const { board, isBoardLoading, workspaceSlug } = useBoardLayout();

  if (isBoardLoading && !board) {
    return (
      <>
        <PageHead title={t("boards.client_360.title")} />
        <div className="flex h-full items-center justify-center">
          <LogoSpinner />
        </div>
      </>
    );
  }

  if (!board || !projectId) {
    return (
      <>
        <PageHead title={t("boards.not_found")} />
        <div className="flex h-full items-center justify-center">
          <p className="text-13 text-tertiary">{t("boards.not_found")}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHead title={`${board.name} - ${t("boards.client_360.title")}`} />
      <BoardClient360Detail workspaceSlug={workspaceSlug} board={board} projectId={projectId} />
    </>
  );
}

export default observer(BoardClienteDetailPage);
