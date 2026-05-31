import { Suspense, useEffect, useMemo, type ReactNode } from "react";
import { observer } from "mobx-react";
import { Navigate, Outlet, useParams } from "react-router";
import useSWR from "swr";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { BoardLayoutProvider } from "@/components/board/board-layout-context";
import {
  BoardHubBackgroundContent,
  BoardHubBackgroundLayer,
  BoardHubBackgroundProvider,
  BoardHubHeaderContentFade,
  BoardHubImmersiveShell,
  useBoardHubBackgroundOptional,
} from "@/components/board/board-hub-background";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { ENABLE_WORKSPACE_BOARDS } from "@/constants/enable-boards";
import { useBoard } from "@/hooks/store/use-board";
import { useRouterParams } from "@/hooks/store/use-router-params";
import { BoardOverviewHeader } from "./header";

function BoardRouteLayout() {
  const params = useParams();
  const { workspaceSlug = "", boardSlug = "" } = params;
  const { setQuery, query } = useRouterParams();
  const { fetchBoardDetails, getBoardBySlug } = useBoard();

  // StoreWrapper no root pode não expor boardSlug; sincroniza para issueFilters (quadro/cronograma).
  useEffect(() => {
    if (!workspaceSlug || !boardSlug) return;
    if (query.boardSlug?.toString() === boardSlug && query.workspaceSlug?.toString() === workspaceSlug) return;
    setQuery({ ...query, workspaceSlug, boardSlug });
  }, [boardSlug, query, setQuery, workspaceSlug]);

  const board = getBoardBySlug(boardSlug);

  const { isLoading: isBoardLoading } = useSWR(
    ENABLE_WORKSPACE_BOARDS && workspaceSlug && boardSlug && !board
      ? `BOARD_LAYOUT_${workspaceSlug}_${boardSlug}`
      : null,
    () => fetchBoardDetails(workspaceSlug, boardSlug),
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const header = useMemo(
    () => <BoardOverviewHeader board={board} workspaceSlug={workspaceSlug} boardSlug={boardSlug} />,
    [board, boardSlug, workspaceSlug]
  );

  if (!ENABLE_WORKSPACE_BOARDS) {
    return <Navigate to={`/${workspaceSlug}`} replace />;
  }

  return (
    <BoardLayoutProvider value={{ board, isBoardLoading, workspaceSlug, boardSlug }}>
      <BoardHubBackgroundProvider workspaceSlug={workspaceSlug} boardSlug={boardSlug}>
        <BoardRouteChrome header={header}>
          <Suspense
            fallback={
              <div className="flex h-full min-h-[200px] items-center justify-center">
                <LogoSpinner />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </BoardRouteChrome>
      </BoardHubBackgroundProvider>
    </BoardLayoutProvider>
  );
}

function BoardRouteChrome({ header, children }: { header: ReactNode; children: ReactNode }) {
  const hasBackground = Boolean(useBoardHubBackgroundOptional()?.imageUrl);

  return (
    <BoardHubImmersiveShell>
      <BoardHubBackgroundLayer />
      <AppHeader header={header} opaque={!hasBackground} rowClassName="h-auto min-h-11 items-start py-2.5" />
      {hasBackground ? <BoardHubHeaderContentFade /> : null}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ContentWrapper className="flex h-full min-h-0 flex-col overflow-hidden bg-transparent">
          <BoardHubBackgroundContent>{children}</BoardHubBackgroundContent>
        </ContentWrapper>
      </div>
    </BoardHubImmersiveShell>
  );
}

export default observer(BoardRouteLayout);
