import { observer } from "mobx-react";
import { useBoardLayout } from "@/components/board/board-layout-context";
import { useLabel } from "@/hooks/store/use-label";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { WorkItemFiltersHOC } from "./base";
import type { TSharedWorkItemFiltersHOCProps } from "./shared";

type TBoardLevelWorkItemFiltersHOCProps = TSharedWorkItemFiltersHOCProps & {
  workspaceSlug: string;
  boardSlug: string;
};

/**
 * Filtros ao nível do board: lista de projetos limitada aos projetos do board (MVP-2).
 */
export const BoardLevelWorkItemFiltersHOC = observer(function BoardLevelWorkItemFiltersHOC(
  props: TBoardLevelWorkItemFiltersHOCProps
) {
  const { children, workspaceSlug, boardSlug, ...rest } = props;
  const { board } = useBoardLayout();
  const { getProjectIdsForBoard } = useProject();
  const {
    workspace: { getWorkspaceMemberIds },
  } = useMember();
  const { getWorkspaceLabelIds } = useLabel();

  const boardProjectIds = board ? getProjectIdsForBoard(board.id) : [];

  return (
    <WorkItemFiltersHOC
      {...rest}
      workspaceSlug={workspaceSlug}
      memberIds={getWorkspaceMemberIds(workspaceSlug)}
      labelIds={getWorkspaceLabelIds(workspaceSlug)}
      projectIds={boardProjectIds}
    >
      {children}
    </WorkItemFiltersHOC>
  );
});
