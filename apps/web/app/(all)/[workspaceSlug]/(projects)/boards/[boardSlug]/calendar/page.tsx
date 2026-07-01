import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "@operoz/i18n";
import { useBoardLayout } from "@/components/board/board-layout-context";
import { BoardCalendarLayoutRoot } from "@/components/board/board-calendar-layout-root";
import { PageHead } from "@/components/core/page-title";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { useWorkspace } from "@/hooks/store/use-workspace";
import type { Route } from "./+types/page";

export default function BoardCalendarPage(_props: Route.ComponentProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const { board, isBoardLoading, workspaceSlug, boardSlug } = useBoardLayout();
  useEffect(() => {
    if (isBoardLoading || board) return;
    navigate(`/${workspaceSlug}/boards/${boardSlug}`, { replace: true });
  }, [board, boardSlug, isBoardLoading, navigate, workspaceSlug]);

  if (isBoardLoading && !board) {
    return (
      <>
        <PageHead title={t("boards.calendar_title")} />
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
    ? `${currentWorkspace.name} - ${board.name} - ${t("boards.tab_calendar")}`
    : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <BoardCalendarLayoutRoot />
    </>
  );
}
