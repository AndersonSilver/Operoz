import { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { attachInstruction, extractInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";
import { observer } from "mobx-react";
import { Transition } from "@headlessui/react";
import { MoreHorizontal } from "lucide-react";
import { EUserPermissions, EUserPermissionsLevel } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { Logo } from "@operis/propel/emoji-icon-picker";
import { IconButton } from "@operis/propel/icon-button";
import { ChevronRightIcon } from "@operis/propel/icons";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { IBoard } from "@operis/types";
import { Tooltip } from "@operis/propel/tooltip";
import { CustomMenu, DragHandle, DropIndicator } from "@operis/ui";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { cn, copyUrlToClipboard } from "@operis/utils";
import { ArchiveBoardModal } from "@/components/board/archive-board-modal";
import { EditBoardModal } from "@/components/board/edit-board-modal";
import { CreateProjectModal } from "@/components/project/create-project-modal";
import { useUserPermissions } from "@/hooks/store/user";
import { SidebarProjectsListItem } from "./projects-list-item";

type Props = {
  workspaceSlug: string;
  board: IBoard;
  projectIds: string[];
  isOpen: boolean;
  onToggle: () => void;
  onOpenOverview: () => void;
  enableBoardReorder?: boolean;
  isLastBoard?: boolean;
  handleOnBoardDrop?: (
    sourceBoardId: string | undefined,
    destinationBoardId: string | undefined,
    shouldDropAtEnd: boolean
  ) => void;
  handleOnProjectDrop?: (
    sourceId: string | undefined,
    destinationId: string | undefined,
    shouldDropAtEnd: boolean
  ) => void;
};

export const BoardSidebarBoardItem = observer(function BoardSidebarBoardItem(props: Props) {
  const {
    workspaceSlug,
    board,
    projectIds,
    isOpen,
    onToggle,
    onOpenOverview,
    enableBoardReorder = false,
    isLastBoard = false,
    handleOnBoardDrop,
    handleOnProjectDrop,
  } = props;
  const { t } = useTranslation();
  const { isMobile } = usePlatformOS();
  const { allowPermissions } = useUserPermissions();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [boardInstruction, setBoardInstruction] = useState<"DRAG_OVER" | "DRAG_BELOW" | undefined>(undefined);

  const boardRowRef = useRef<HTMLDivElement | null>(null);
  const boardDragHandleRef = useRef<HTMLButtonElement | null>(null);

  const isWorkspaceAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const projectDragInstanceId = `BOARD_PROJECTS_${board.id}`;

  useEffect(() => {
    const element = boardRowRef.current;
    const dragHandleElement = boardDragHandleRef.current;
    if (!element || !enableBoardReorder) return;

    return combine(
      draggable({
        element,
        dragHandle: dragHandleElement ?? undefined,
        getInitialData: () => ({ id: board.id, dragInstanceId: "BOARDS" }),
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) =>
          source?.data?.id !== board.id && source?.data?.dragInstanceId === "BOARDS",
        getData: ({ input, element: el }) =>
          attachInstruction({ id: board.id }, {
            input,
            element: el,
            currentLevel: 0,
            indentPerLevel: 0,
            mode: isLastBoard ? "last-in-group" : "standard",
          }),
        onDrag: ({ self }) => {
          const extracted = extractInstruction(self?.data)?.type;
          setBoardInstruction(
            extracted
              ? extracted === "reorder-below" && isLastBoard
                ? "DRAG_BELOW"
                : "DRAG_OVER"
              : undefined
          );
        },
        onDragLeave: () => setBoardInstruction(undefined),
        onDrop: ({ self, source }) => {
          setBoardInstruction(undefined);
          const extracted = extractInstruction(self?.data)?.type;
          const currentInstruction = extracted
            ? extracted === "reorder-below" && isLastBoard
              ? "DRAG_BELOW"
              : "DRAG_OVER"
            : undefined;
          if (!currentInstruction) return;
          handleOnBoardDrop?.(
            source?.data?.id as string | undefined,
            self?.data?.id as string | undefined,
            currentInstruction === "DRAG_BELOW"
          );
        },
      })
    );
  }, [board.id, enableBoardReorder, handleOnBoardDrop, isLastBoard]);

  return (
    <>
      <EditBoardModal workspaceSlug={workspaceSlug} board={board} isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} />
      <ArchiveBoardModal
        workspaceSlug={workspaceSlug}
        board={board}
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
      />
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        workspaceSlug={workspaceSlug}
        data={{ board_id: board.id }}
      />
      <div className="group/board-row flex flex-col">
        {boardInstruction === "DRAG_OVER" && <DropIndicator isVisible />}
        <div
          ref={boardRowRef}
          className="flex w-full items-center rounded-sm py-0.5 pr-1 pl-1 hover:bg-layer-transparent-hover"
        >
          {enableBoardReorder && isWorkspaceAdmin && (
            <button
              type="button"
              ref={boardDragHandleRef}
              className="mr-0.5 hidden cursor-grab text-placeholder group-hover/board-row:block"
              aria-label={t("drag_to_rearrange")}
            >
              <DragHandle className="bg-transparent" />
            </button>
          )}
          <button
            type="button"
            className="flex min-w-0 flex-1 items-start gap-1.5 rounded-md py-1 pl-1 text-left text-13 font-medium text-secondary"
            onClick={onOpenOverview}
          >
            <span className="grid size-4 shrink-0 place-items-center">
              <Logo logo={board.logo_props} size={16} />
            </span>
            <Tooltip isMobile={isMobile} tooltipContent={board.name} position="right">
              <span className="min-w-0 flex-1 truncate">{board.name}</span>
            </Tooltip>
          </button>
          {isWorkspaceAdmin && (
            <CustomMenu
              menuItemsClassName="z-30"
              closeOnSelect
              customButton={
                <MoreHorizontal
                  className="hidden h-3.5 w-3.5 shrink-0 text-placeholder group-hover/board-row:block"
                  aria-hidden
                />
              }
            >
              <CustomMenu.MenuItem onClick={() => setIsCreateProjectOpen(true)}>{t("boards.add_project")}</CustomMenu.MenuItem>
              <CustomMenu.MenuItem onClick={() => setIsEditOpen(true)}>{t("boards.edit")}</CustomMenu.MenuItem>
              <CustomMenu.MenuItem onClick={() => setIsArchiveOpen(true)}>{t("boards.archive")}</CustomMenu.MenuItem>
            </CustomMenu>
          )}
          <IconButton
            variant="ghost"
            size="sm"
            icon={ChevronRightIcon}
            onClick={onToggle}
            className="shrink-0 text-placeholder"
            iconClassName={cn("transition-transform", { "rotate-90": isOpen })}
            aria-label={board.name}
          />
        </div>
        {isLastBoard && boardInstruction === "DRAG_BELOW" && <DropIndicator isVisible />}
        <Transition
          show={isOpen}
          enter="transition duration-75 ease-out"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition duration-50 ease-in"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="flex flex-col">
            {projectIds.length === 0 ? (
              <p className="py-1.5 pr-2 pl-6 text-11 text-tertiary">{t("boards.empty_projects")}</p>
            ) : (
              projectIds.map((projectId, index) => (
                <SidebarProjectsListItem
                  key={projectId}
                  projectId={projectId}
                  handleCopyText={() => {
                    copyUrlToClipboard(`${workspaceSlug}/projects/${projectId}/issues`).then(() => {
                      setToast({
                        type: TOAST_TYPE.SUCCESS,
                        title: t("link_copied"),
                        message: t("project_link_copied_to_clipboard"),
                      });
                    });
                  }}
                  projectListType="JOINED"
                  handleOnProjectDrop={handleOnProjectDrop}
                  dragInstanceId={projectDragInstanceId}
                  isLastChild={index === projectIds.length - 1}
                  showBoardActions
                  nestedUnderBoard
                />
              ))
            )}
          </div>
        </Transition>
      </div>
    </>
  );
});
