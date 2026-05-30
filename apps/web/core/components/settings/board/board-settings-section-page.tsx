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
import { BoardSettingsComingSoon } from "@/components/settings/board/board-settings-coming-soon";
import { BoardSettingsPageHeader } from "@/components/settings/board/board-settings-page-header";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import type { TBoardSettingsNavItem } from "@/constants/board-settings";
import { useWorkspace } from "@/hooks/store/use-workspace";

type OutletContext = {
  board: IBoard;
  workspaceSlug: string;
  boardSlug: string;
};

type Props = {
  workspaceSlug: string;
  section: TBoardSettingsNavItem;
};

export const BoardSettingsSectionPage = observer(function BoardSettingsSectionPage(props: Props) {
  const { workspaceSlug, section } = props;
  const { board } = useOutletContext<OutletContext>();
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();

  const pageTitle = board?.name ? `${board.name} - ${t(section.i18n_label)}` : undefined;

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
      <BoardSettingsComingSoon titleKey={section.i18n_label} />
    </SettingsContentWrapper>
  );
});
