import { observer } from "mobx-react";
import { useOutletContext } from "react-router";
import { useTranslation } from "@operoz/i18n";
import type { IBoard } from "@operoz/types";
import { PageHead } from "@/components/core/page-title";
import { BoardEmailAudit } from "@/components/settings/board/board-email-audit";
import { BoardSettingsPageHeader } from "@/components/settings/board/board-settings-page-header";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { getBoardSettingsSection } from "@/constants/board-settings";
import { useWorkspace } from "@/hooks/store/use-workspace";
import type { Route } from "./+types/page";

const section = getBoardSettingsSection("email_audit")!;

type OutletContext = {
  board: IBoard;
  workspaceSlug: string;
  boardSlug: string;
};

function BoardEmailAuditSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, boardSlug } = params;
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
      <p className="mb-4 text-13 text-tertiary">{t("boards.settings.notifications.audit.lead")}</p>
      <BoardEmailAudit workspaceSlug={workspaceSlug} boardSlug={boardSlug} />
    </SettingsContentWrapper>
  );
}

export default observer(BoardEmailAuditSettingsPage);
