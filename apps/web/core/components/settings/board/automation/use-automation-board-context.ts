import { useEffect, useMemo, useState } from "react";
import type { IBoard, IBoardMember } from "@operoz/types";
import { BoardService } from "@/services/board/board.service";
import { BoardAccessService } from "@/services/board/board-access.service";
import { useProject } from "@/hooks/store/use-project";

const boardService = new BoardService();
const boardAccessService = new BoardAccessService();

export type AutomationBoardOption = { id: string; label: string; sublabel?: string };

export type AutomationBoardContext = {
  isLoading: boolean;
  states: AutomationBoardOption[];
  projects: AutomationBoardOption[];
  members: AutomationBoardOption[];
  scripts: AutomationBoardOption[];
  emailTemplates: AutomationBoardOption[];
};

export function useAutomationBoardContext(workspaceSlug: string, board: IBoard): AutomationBoardContext {
  const { getProjectIdsForBoard, getProjectById, fetchProjects } = useProject();
  const [states, setStates] = useState<AutomationBoardOption[]>([]);
  const [members, setMembers] = useState<AutomationBoardOption[]>([]);
  const [scripts, setScripts] = useState<AutomationBoardOption[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<AutomationBoardOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const projects = useMemo(() => {
    return getProjectIdsForBoard(board.id)
      .map((id) => getProjectById(id))
      .filter(Boolean)
      .map((project) => ({
        id: project!.id,
        label: project!.name,
        sublabel: project!.identifier,
      }));
  }, [board.id, getProjectIdsForBoard, getProjectById]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    Promise.all([
      fetchProjects(workspaceSlug),
      boardService.getBoardMeta(workspaceSlug, board.slug),
      boardAccessService.getBoardMembers(workspaceSlug, board.slug),
      boardService.getAutomationScripts(workspaceSlug, board.slug),
      boardService.getAutomationEmailTemplates(workspaceSlug, board.slug),
    ])
      .then(([, meta, boardMembers, scriptRows, templateRows]) => {
        if (cancelled) return;
        setStates(
          (meta.state_distribution ?? [])
            .filter((s) => s.state_id)
            .map((s) => ({
              id: s.state_id!,
              label: s.state_name,
            }))
        );
        setMembers(
          (boardMembers as IBoardMember[]).map((m) => ({
            id: m.user_id,
            label: m.member?.display_name ?? m.email,
            sublabel: m.email,
          }))
        );
        setScripts(
          scriptRows
            .filter((s) => s.is_active)
            .map((s) => ({ id: s.id, label: s.name, sublabel: s.description || undefined }))
        );
        setEmailTemplates(
          templateRows
            .filter((t) => t.is_active)
            .map((t) => ({ id: t.id, label: t.name, sublabel: t.subject || undefined }))
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [workspaceSlug, board.slug, fetchProjects]);

  return { isLoading, states, projects, members, scripts, emailTemplates };
}
