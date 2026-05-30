import { observer } from "mobx-react";
import { Logo } from "@operis/propel/emoji-icon-picker";
import { Breadcrumbs } from "@operis/ui";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { ENABLE_WORKSPACE_BOARDS } from "@/constants/enable-boards";
import { useBoard } from "@/hooks/store/use-board";
import { useProject } from "@/hooks/store/use-project";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const BoardBreadcrumb = observer(function BoardBreadcrumb(props: Props) {
  const { workspaceSlug, projectId } = props;
  const { getPartialProjectById } = useProject();
  const { getBoardById } = useBoard();

  const project = getPartialProjectById(projectId);
  const board = project?.board_id ? getBoardById(project.board_id) : undefined;

  if (!ENABLE_WORKSPACE_BOARDS || !board) return null;

  return (
    <Breadcrumbs.Item
      component={
        <BreadcrumbLink
          label={board.name}
          href={`/${workspaceSlug}/boards/${board.slug}`}
          icon={
            <span className="grid size-4 place-items-center">
              <Logo logo={board.logo_props} size={14} />
            </span>
          }
        />
      }
    />
  );
});
