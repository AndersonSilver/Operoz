"use client";

import { observer } from "mobx-react";
import { useOutletContext } from "react-router";
import type { IBoard } from "@operoz/types";
import { useTranslation } from "@operoz/i18n";
import { PageHead } from "@/components/core/page-title";
import { BoardDemandFormsSettings } from "@/components/settings/board/board-demand-forms-settings";
import { BoardSettingsPageHeader } from "@/components/settings/board/board-settings-page-header";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { getBoardSettingsSection } from "@/constants/board-settings";
import { useWorkspace } from "@/hooks/store/use-workspace";
import type { Route } from "./+types/page";

const section = getBoardSettingsSection("intake")!;

type OutletContext = {
  board: IBoard;
  workspaceSlug: string;
  boardSlug: string;
};

function BoardIntakePage({ params }: Route.ComponentProps) {
  const { board } = useOutletContext<OutletContext>();
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();

  const pageTitle = board?.name ? `${board.name} - ${t(section.i18n_label)}` : undefined;

  return (
    <SettingsContentWrapper
      hugging
      header={
        <BoardSettingsPageHeader
          workspaceSlug={params.workspaceSlug}
          workspaceName={currentWorkspace?.name}
          boardName={board?.name}
          boardSlug={board?.slug}
          boardLogo={board?.logo_props}
          section={section}
        />
      }
    >
      <PageHead title={pageTitle} />
      <BoardDemandFormsSettings workspaceSlug={params.workspaceSlug} board={board} />
    </SettingsContentWrapper>
  );
}

export default observer(BoardIntakePage);
