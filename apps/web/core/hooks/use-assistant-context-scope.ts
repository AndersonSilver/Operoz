import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useLocation } from "react-router";
import { useAssistant } from "@/hooks/use-assistant";
import { useBoard } from "@/hooks/store/use-board";
import { useProject } from "@/hooks/store/use-project";
import {
  ASSISTANT_BOARDS_ENABLED,
  isAssistantSessionContextReady,
  readPersistedAssistantContext,
} from "@/lib/assistant-context-scope";
import type { TAssistantSessionContext } from "@/services/assistant.service";

function parseRouteContext(pathname: string): TAssistantSessionContext {
  const segments = pathname.split("/").filter(Boolean);
  const boardsIdx = segments.indexOf("boards");
  if (boardsIdx >= 0 && segments[boardsIdx + 1]) {
    return { board_slug: segments[boardsIdx + 1] };
  }
  const projectsIdx = segments.indexOf("projects");
  if (projectsIdx >= 0 && segments[projectsIdx + 1]) {
    return { project_id: segments[projectsIdx + 1] };
  }
  const visao360Idx = segments.indexOf("visao-360");
  if (visao360Idx >= 0 && segments[visao360Idx + 1]) {
    return { project_id: segments[visao360Idx + 1] };
  }
  return {};
}

export function useAssistantContextScope() {
  const { workspaceSlug } = useParams();
  const location = useLocation();
  const assistant = useAssistant();
  const { currentWorkspaceBoardIds, boardMap, fetchBoards } = useBoard();
  const { getProjectById, getProjectIdsForBoard, fetchProjects, joinedProjectIds } = useProject();
  const slug = workspaceSlug?.toString() ?? assistant.workspaceSlug ?? "";

  useEffect(() => {
    if (!slug) return;
    if (ASSISTANT_BOARDS_ENABLED) {
      void fetchBoards(slug);
    }
    void fetchProjects(slug);
  }, [slug, fetchBoards, fetchProjects]);

  const boards = currentWorkspaceBoardIds.map((id) => boardMap[id]).filter(Boolean);
  const routeContext = useMemo(() => parseRouteContext(location.pathname), [location.pathname]);
  const selectedBoardSlug = assistant.sessionContext.board_slug ?? "";
  const selectedBoard = boards.find((board) => board.slug === selectedBoardSlug);
  const selectedProjectId = assistant.sessionContext.project_id ?? "";

  const boardProjectIds = useMemo(() => {
    if (selectedBoard) {
      return getProjectIdsForBoard(selectedBoard.id);
    }
    if (ASSISTANT_BOARDS_ENABLED) {
      return [];
    }
    return joinedProjectIds;
  }, [selectedBoard, getProjectIdsForBoard, joinedProjectIds]);

  const projects = useMemo(
    () =>
      boardProjectIds
        .map((id) => getProjectById(id))
        .filter((project): project is NonNullable<typeof project> => Boolean(project)),
    [boardProjectIds, getProjectById]
  );

  const hasBoards = boards.length > 0;
  const isReady = isAssistantSessionContextReady(assistant.sessionContext, {
    boardsEnabled: ASSISTANT_BOARDS_ENABLED,
    hasBoards,
  });

  return {
    slug,
    boards,
    projects,
    hasBoards,
    isReady,
    selectedBoardSlug,
    selectedBoard,
    selectedProjectId,
    boardsEnabled: ASSISTANT_BOARDS_ENABLED,
    getProjectIdsForBoard,
    routeContext,
  };
}

export function useAssistantContextDefaults() {
  const assistant = useAssistant();
  const { getProjectIdsForBoard, joinedProjectIds, loader } = useProject();
  const { slug, boards, hasBoards, routeContext } = useAssistantContextScope();

  useEffect(() => {
    if (!slug || assistant.isInitializing) return;
    if (ASSISTANT_BOARDS_ENABLED && loader !== "loaded" && joinedProjectIds.length === 0) return;
    if (ASSISTANT_BOARDS_ENABLED && hasBoards && boards.length === 0) return;

    const persisted = readPersistedAssistantContext(slug);
    let boardSlug = assistant.sessionContext.board_slug ?? routeContext.board_slug ?? persisted.board_slug;
    if (ASSISTANT_BOARDS_ENABLED && hasBoards && !boardSlug) {
      boardSlug = boards[0]?.slug;
    }

    const board = boards.find((item) => item.slug === boardSlug);
    const candidateProjectIds = board
      ? getProjectIdsForBoard(board.id)
      : ASSISTANT_BOARDS_ENABLED
        ? []
        : joinedProjectIds;

    const routeProjectId =
      routeContext.project_id && candidateProjectIds.includes(routeContext.project_id)
        ? routeContext.project_id
        : undefined;
    const persistedProjectId =
      persisted.project_id && candidateProjectIds.includes(persisted.project_id) ? persisted.project_id : undefined;
    const currentProjectId =
      assistant.sessionContext.project_id && candidateProjectIds.includes(assistant.sessionContext.project_id)
        ? assistant.sessionContext.project_id
        : undefined;

    const projectId = currentProjectId ?? routeProjectId ?? persistedProjectId ?? candidateProjectIds[0];

    const nextContext: TAssistantSessionContext = {};
    if (boardSlug) nextContext.board_slug = boardSlug;
    if (projectId) nextContext.project_id = projectId;

    const boardChanged = (nextContext.board_slug ?? "") !== (assistant.sessionContext.board_slug ?? "");
    const projectChanged = (nextContext.project_id ?? "") !== (assistant.sessionContext.project_id ?? "");
    if ((boardChanged || projectChanged) && (nextContext.board_slug || nextContext.project_id)) {
      void assistant.updateSessionContext(nextContext);
    }
  }, [
    slug,
    assistant.isInitializing,
    assistant.sessionContext.board_slug,
    assistant.sessionContext.project_id,
    routeContext.board_slug,
    routeContext.project_id,
    boards,
    hasBoards,
    joinedProjectIds,
    loader,
    getProjectIdsForBoard,
    assistant,
  ]);
}
