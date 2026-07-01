import type { ReactNode } from "react";
import { observer } from "mobx-react";
import { useLocation } from "react-router";
import { Row } from "@operoz/ui";
import { cn } from "@operoz/utils";
import {
  BoardHubBackgroundContent,
  BoardHubBackgroundLayer,
  BoardHubBackgroundProvider,
  BoardHubImmersiveShell,
  BOARD_HUB_GLASS_HEADER,
  isBoardHubImmersivePath,
  useBoardHubHasBackground,
} from "@/components/board/board-hub-background";
import { useBoard } from "@/hooks/store/use-board";
import { useProject } from "@/hooks/store/use-project";

/** Rotas de conteúdo do projeto que herdam o wallpaper do board. */
export function isProjectBoardBackgroundPath(pathname: string) {
  return /\/projects\/[^/]+\/(issues|modules|cycles|intake|views|pages|status-report|archives)(\/|$)/.test(pathname);
}

export function usesImmersiveWorkspaceChrome(pathname: string) {
  return isBoardHubImmersivePath(pathname) || isProjectBoardBackgroundPath(pathname);
}

/** Chrome imersivo nas rotas de conteúdo do projeto. */
export function useProjectBoardImmersiveChrome(): boolean {
  const { pathname } = useLocation();
  return isProjectBoardBackgroundPath(pathname);
}

export function useWorkspaceImmersiveChrome(): boolean {
  const { pathname } = useLocation();
  return usesImmersiveWorkspaceChrome(pathname);
}

type ProjectBoardBackgroundRootProps = {
  workspaceSlug: string;
  projectId: string;
  children: ReactNode;
};

export const ProjectBoardBackgroundRoot = observer(function ProjectBoardBackgroundRoot(
  props: ProjectBoardBackgroundRootProps
) {
  const { workspaceSlug, projectId, children } = props;
  const { getProjectById } = useProject();
  const { getBoardById } = useBoard();

  const project = getProjectById(projectId);
  const boardSlug = project?.board_id ? getBoardById(project.board_id)?.slug : undefined;

  if (!boardSlug) {
    return <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">{children}</div>;
  }

  return (
    <BoardHubBackgroundProvider workspaceSlug={workspaceSlug} boardSlug={boardSlug}>
      <BoardHubImmersiveShell>
        <BoardHubBackgroundLayer />
        <BoardHubBackgroundContent>{children}</BoardHubBackgroundContent>
      </BoardHubImmersiveShell>
    </BoardHubBackgroundProvider>
  );
});

type ProjectTabNavigationChromeProps = {
  children: ReactNode;
};

/** Barra de abas do projeto com vidro quando há wallpaper do board. */
export function ProjectTabNavigationChrome({ children }: ProjectTabNavigationChromeProps) {
  const hasBackground = useBoardHubHasBackground();

  return (
    <div className="z-20 shrink-0">
      <Row
        className={cn(
          "flex h-header w-full items-center gap-2 border-b",
          hasBackground ? BOARD_HUB_GLASS_HEADER : "border-subtle bg-surface-1"
        )}
      >
        {children}
      </Row>
    </div>
  );
}
