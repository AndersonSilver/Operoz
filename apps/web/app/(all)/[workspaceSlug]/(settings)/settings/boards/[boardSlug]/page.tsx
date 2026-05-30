/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useOutletContext } from "react-router";
import { useTranslation } from "@plane/i18n";
import type { IBoard } from "@plane/types";
import { PageHead } from "@/components/core/page-title";
import { BoardInformationsForm } from "@/components/settings/board/board-informations-form";
import { BoardSettingsPageHeader } from "@/components/settings/board/board-settings-page-header";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { BoardInformationsHeading } from "@/components/settings/board/board-informations-heading";
import { BOARD_SETTINGS_NAV } from "@/constants/board-settings";
import { useWorkspace } from "@/hooks/store/use-workspace";
import type { Route } from "./+types/page";

type OutletContext = {
  board: IBoard;
  workspaceSlug: string;
  boardSlug: string;
};

function BoardInformationsSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  const { board } = useOutletContext<OutletContext>();
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();
  const section = BOARD_SETTINGS_NAV[0];

  const pageTitle = board?.name
    ? `${board.name} - ${t("boards.settings.nav.informations")}`
    : undefined;

  return (
    <SettingsContentWrapper
      header={
        <BoardSettingsPageHeader
          workspaceSlug={workspaceSlug}
          workspaceName={currentWorkspace?.name}
          boardName={board.name}
          boardSlug={board.slug}
          boardLogo={board.logo_props}
          section={section}
        />
      }
    >
      <PageHead title={pageTitle} />
      <BoardInformationsHeading board={board} />
      <BoardInformationsForm workspaceSlug={workspaceSlug} board={board} />
    </SettingsContentWrapper>
  );
}

export default observer(BoardInformationsSettingsPage);
