import useSWR from "swr";
import { useBoard } from "@/hooks/store/use-board";
import { useBoardIssueType } from "@/hooks/store/use-board-issue-type";
import { useProject } from "@/hooks/store/use-project";

/** Etapas de módulo = tipos de card habilitados no board (fonte única). */
export function useProjectBoardModuleStages(workspaceSlug: string | undefined, projectId: string | undefined) {
  const { getProjectById } = useProject();
  const { getBoardById } = useBoard();
  const { fetchBoardIssueTypes, getBoardIssueTypes } = useBoardIssueType();

  const project = projectId ? getProjectById(projectId) : undefined;
  const board = project?.board_id ? getBoardById(project.board_id) : undefined;
  const boardSlug = board?.slug;

  const { isLoading, mutate } = useSWR(
    workspaceSlug && boardSlug ? `BOARD_ISSUE_TYPES_MODULE_STAGE_${workspaceSlug}_${boardSlug}` : null,
    () => fetchBoardIssueTypes(workspaceSlug!, boardSlug!),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    }
  );

  const stages =
    workspaceSlug && boardSlug
      ? getBoardIssueTypes(workspaceSlug, boardSlug).filter((item) => item.is_enabled && item.is_active)
      : [];

  return {
    stages,
    boardSlug,
    isLoading,
    refresh: mutate,
  };
}
