import { observer } from "mobx-react";
import { useTranslation } from "@operis/i18n";
import { useBoardLayout } from "@/components/board/board-layout-context";
import { BoardClient360List } from "@/components/board/client-360/board-client-360-list";
import { PageHead } from "@/components/core/page-title";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { useWorkspace } from "@/hooks/store/use-workspace";
import type { Route } from "./+types/page";

function BoardClientesPage(_props: Route.ComponentProps) {
  const { t } = useTranslation();
  const { currentWorkspace } = useWorkspace();
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

  if (!board) {
    return (
      <>
        <PageHead title={t("boards.not_found")} />
        <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
          <p className="text-15 font-medium text-primary">{t("boards.not_found")}</p>
        </div>
      </>
    );
  }

  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${t("boards.client_360.title")}`
    : t("boards.client_360.title");

  return (
    <>
      <PageHead title={pageTitle} />
      <BoardClient360List workspaceSlug={workspaceSlug} board={board} />
    </>
  );
}

export default observer(BoardClientesPage);
