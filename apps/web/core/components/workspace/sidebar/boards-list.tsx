import { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Disclosure, Transition } from "@headlessui/react";
import { EUserPermissions, EUserPermissionsLevel } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import { Logo } from "@operoz/propel/emoji-icon-picker";
import { PlusIcon, ChevronRightIcon } from "@operoz/propel/icons";
import { IconButton } from "@operoz/propel/icon-button";
import { Tooltip } from "@operoz/propel/tooltip";
import { Loader } from "@operoz/ui";
import { cn, copyUrlToClipboard, orderJoinedProjects } from "@operoz/utils";
import type { TProject } from "@/plane-web/types";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import { CreateBoardModal } from "@/components/board/create-board-modal";
import { useBoard } from "@/hooks/store/use-board";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import { SidebarSectionHeader } from "@/components/sidebar/sidebar-section-header";
import { BoardSidebarBoardItem } from "./board-sidebar-board-item";
import { BoardsSidebarEmptyState } from "./boards-empty-state";
import { SidebarProjectsListItem } from "./projects-list-item";

function getScrollableParent(element: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = element.parentElement;

  while (current) {
    const { overflowY } = getComputedStyle(current);
    if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

export const SidebarBoardsList = observer(function SidebarBoardsList() {
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();
  const router = useAppRouter();
  const { allowPermissions } = useUserPermissions();
  const { loader, currentWorkspaceBoardIds, getBoardById, reorderBoard } = useBoard();
  const { getProjectIdsForBoard, unassignedProjectIds, getPartialProjectById, updateProjectView } = useProject();
  const boardsPanelRef = useRef<HTMLDivElement | null>(null);

  const [isBoardsSectionOpen, setIsBoardsSectionOpen] = useState(true);
  const [openBoardIds, setOpenBoardIds] = useState<Record<string, boolean>>({});
  const [isUnassignedOpen, setIsUnassignedOpen] = useState(true);
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);

  const isWorkspaceAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const isLoading = loader === "init-loader";

  useEffect(() => {
    const stored = localStorage.getItem("isBoardsListOpen");
    if (stored !== null) setIsBoardsSectionOpen(stored === "true");
  }, []);

  useEffect(() => {
    if (currentWorkspaceBoardIds.length === 0) return;
    setOpenBoardIds((prev) => {
      const next = { ...prev };
      currentWorkspaceBoardIds.forEach((id) => {
        if (next[id] === undefined) next[id] = true;
      });
      return next;
    });
  }, [currentWorkspaceBoardIds]);

  const toggleBoardsSection = (open: boolean) => {
    setIsBoardsSectionOpen(open);
    localStorage.setItem("isBoardsListOpen", String(open));
  };

  const toggleBoard = (boardId: string) => {
    setOpenBoardIds((prev) => ({ ...prev, [boardId]: !prev[boardId] }));
  };

  const handleBoardOverview = (slug: string) => {
    if (!workspaceSlug) return;
    router.push(`/${workspaceSlug}/boards/${slug}`);
  };

  const handleOnBoardDrop = (
    sourceBoardId: string | undefined,
    destinationBoardId: string | undefined,
    shouldDropAtEnd: boolean
  ) => {
    if (!workspaceSlug || !sourceBoardId || !destinationBoardId || !isWorkspaceAdmin) return;
    if (sourceBoardId === destinationBoardId) return;
    reorderBoard(workspaceSlug.toString(), sourceBoardId, destinationBoardId, shouldDropAtEnd).catch(() => {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("boards.reorder_failed"),
      });
    });
  };

  const handleOnBoardProjectDrop =
    (boardId: string) =>
    (sourceId: string | undefined, destinationId: string | undefined, shouldDropAtEnd: boolean) => {
      if (!workspaceSlug || !sourceId || !destinationId) return;
      if (sourceId === destinationId) return;

      const projectIds = getProjectIdsForBoard(boardId);
      const projectsList: TProject[] = [];
      projectIds.forEach((projectId) => {
        const project = getPartialProjectById(projectId);
        if (project) projectsList.push(project);
      });

      const sourceIndex = projectIds.indexOf(sourceId);
      const destinationIndex = shouldDropAtEnd ? projectIds.length : projectIds.indexOf(destinationId);
      if (sourceIndex < 0 || destinationIndex < 0 || projectsList.length <= 0) return;

      const updatedSortOrder = orderJoinedProjects(sourceIndex, destinationIndex, sourceId, projectsList);
      if (updatedSortOrder === undefined) return;

      updateProjectView(workspaceSlug.toString(), sourceId, { sort_order: updatedSortOrder }).catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("error"),
          message: t("boards.reorder_failed"),
        });
      });
    };

  useEffect(() => {
    const panel = boardsPanelRef.current;
    if (!panel) return;

    const element = getScrollableParent(panel);
    if (!element) return;

    return combine(
      autoScrollForElements({
        element,
        canScroll: ({ source }) =>
          source?.data?.dragInstanceId === "BOARDS" ||
          (typeof source?.data?.dragInstanceId === "string" &&
            source.data.dragInstanceId.startsWith("BOARD_PROJECTS_")),
        getAllowedAxis: () => "vertical",
      })
    );
  }, []);

  const showUnassigned = unassignedProjectIds.length > 0;

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader className="h-4 w-4">
          <Loader.Item height="16px" />
        </Loader>
      </div>
    );
  }

  return (
    <>
      {workspaceSlug && (
        <CreateBoardModal
          workspaceSlug={workspaceSlug.toString()}
          isOpen={isCreateBoardModalOpen}
          onClose={() => setIsCreateBoardModalOpen(false)}
        />
      )}
      <div className="flex flex-col">
        <Disclosure as="div" className="flex flex-col" defaultOpen={isBoardsSectionOpen}>
          <SidebarSectionHeader
            label={t("boards.title")}
            isOpen={isBoardsSectionOpen}
            onToggle={() => toggleBoardsSection(!isBoardsSectionOpen)}
            toggleAriaLabel={t("boards.title")}
            actions={
              <>
                {isWorkspaceAdmin && (
                  <Tooltip tooltipHeading={t("boards.create")} tooltipContent="">
                    <IconButton
                      variant="ghost"
                      size="sm"
                      icon={PlusIcon}
                      onClick={() => setIsCreateBoardModalOpen(true)}
                      className="text-tertiary hover:text-secondary"
                      aria-label={t("boards.create")}
                    />
                  </Tooltip>
                )}
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={ChevronRightIcon}
                  onClick={() => toggleBoardsSection(!isBoardsSectionOpen)}
                  className="text-tertiary hover:text-secondary"
                  iconClassName={cn("transition-transform duration-150", {
                    "rotate-90": isBoardsSectionOpen,
                  })}
                  aria-label={t("boards.title")}
                />
              </>
            }
          />

          <Transition
            show={isBoardsSectionOpen}
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Disclosure.Panel as="div" ref={boardsPanelRef} className="flex flex-col gap-0.5" static>
              {currentWorkspaceBoardIds.length === 0 ? (
                <BoardsSidebarEmptyState
                  canCreate={isWorkspaceAdmin}
                  onCreate={() => setIsCreateBoardModalOpen(true)}
                />
              ) : (
                currentWorkspaceBoardIds.map((boardId, boardIndex) => {
                  const board = getBoardById(boardId);
                  if (!board) return null;
                  const projectIds = getProjectIdsForBoard(boardId);
                  const isBoardOpen = openBoardIds[boardId] ?? true;
                  return (
                    <BoardSidebarBoardItem
                      key={board.id}
                      workspaceSlug={workspaceSlug!.toString()}
                      board={board}
                      projectIds={projectIds}
                      isOpen={isBoardOpen}
                      onToggle={() => toggleBoard(board.id)}
                      onOpenOverview={() => handleBoardOverview(board.slug)}
                      enableBoardReorder={isWorkspaceAdmin}
                      isLastBoard={boardIndex === currentWorkspaceBoardIds.length - 1}
                      handleOnBoardDrop={handleOnBoardDrop}
                      handleOnProjectDrop={handleOnBoardProjectDrop(boardId)}
                    />
                  );
                })
              )}

              {showUnassigned && (
                <Disclosure as="div" defaultOpen={isUnassignedOpen} className="mt-1 border-t border-subtle pt-1">
                  <div className="flex w-full items-center justify-between rounded-sm px-2 py-1">
                    <Disclosure.Button
                      as="button"
                      type="button"
                      className="flex w-full items-center text-left text-13 font-semibold text-placeholder"
                      onClick={() => setIsUnassignedOpen(!isUnassignedOpen)}
                    >
                      {t("boards.without_board")}
                    </Disclosure.Button>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      icon={ChevronRightIcon}
                      onClick={() => setIsUnassignedOpen(!isUnassignedOpen)}
                      className="text-placeholder"
                      iconClassName={cn("transition-transform", {
                        "rotate-90": isUnassignedOpen,
                      })}
                    />
                  </div>
                  <Transition show={isUnassignedOpen}>
                    <Disclosure.Panel static className="flex flex-col">
                      {unassignedProjectIds.map((projectId, index) => (
                        <SidebarProjectsListItem
                          key={projectId}
                          projectId={projectId}
                          handleCopyText={() => {
                            if (!workspaceSlug) return;
                            copyUrlToClipboard(`${workspaceSlug}/projects/${projectId}/issues`).then(() => {
                              setToast({
                                type: TOAST_TYPE.SUCCESS,
                                title: t("link_copied"),
                                message: t("project_link_copied_to_clipboard"),
                              });
                            });
                          }}
                          projectListType="JOINED"
                          disableDrag
                          disableDrop
                          isLastChild={index === unassignedProjectIds.length - 1}
                          showBoardActions
                          nestedUnderBoard
                        />
                      ))}
                    </Disclosure.Panel>
                  </Transition>
                </Disclosure>
              )}
            </Disclosure.Panel>
          </Transition>
        </Disclosure>
      </div>
    </>
  );
});
