"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useOutletContext } from "react-router";
import { useTranslation } from "@operoz/i18n";
import type { IBoard } from "@operoz/types";
import { PageHead } from "@/components/core/page-title";
import { BoardIntakeFormsSettings } from "@/components/settings/board/board-intake-forms-settings";
import { BoardSupportSlaSettings } from "@/components/settings/board/board-support-sla-settings";
import { BoardSupportQueuesSettings } from "@/components/settings/board/board-support-queues-settings";
import { SupportSettingsTabs } from "@/components/settings/board/support/support-settings-tabs";
import { BoardSettingsPageHeader } from "@/components/settings/board/board-settings-page-header";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { getBoardSettingsSection } from "@/constants/board-settings";
import { useWorkspace } from "@/hooks/store/use-workspace";
import type { Route } from "./+types/page";

const section = getBoardSettingsSection("intake_forms")!;

type OutletContext = {
  board: IBoard;
  workspaceSlug: string;
  boardSlug: string;
};

type SustentacaoTab = "forms" | "queues" | "sla";

function BoardIntakeFormsPage({ params }: Route.ComponentProps) {
  const { board } = useOutletContext<OutletContext>();
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SustentacaoTab>("forms");

  const pageTitle = board?.name ? `${board.name} - ${t(section.i18n_label)}` : undefined;

  const tabs: { key: SustentacaoTab; label: string }[] = [
    { key: "forms", label: t("boards.settings.intake_forms.title") },
    { key: "queues", label: t("boards.settings.support_queues.title") },
    { key: "sla", label: t("boards.settings.support_sla.title") },
  ];

  return (
    <SettingsContentWrapper
      hugging
      header={
        <BoardSettingsPageHeader
          workspaceSlug={params.workspaceSlug}
          workspaceName={currentWorkspace?.name}
          boardName={board.name}
          boardSlug={board.slug}
          boardLogo={board.logo_props}
          section={section}
        />
      }
    >
      <PageHead title={pageTitle} />
      <div className="space-y-6">
        <SupportSettingsTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        {activeTab === "forms" ? <BoardIntakeFormsSettings workspaceSlug={params.workspaceSlug} board={board} /> : null}
        {activeTab === "queues" ? (
          <BoardSupportQueuesSettings workspaceSlug={params.workspaceSlug} board={board} />
        ) : null}
        {activeTab === "sla" ? <BoardSupportSlaSettings workspaceSlug={params.workspaceSlug} board={board} /> : null}
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(BoardIntakeFormsPage);
