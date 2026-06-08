import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { attachInstruction, extractInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";
import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
import { createRoot } from "react-dom/client";
import scrollIntoView from "smooth-scroll-into-view-if-needed";
import { Settings, Share2, LogOut, Star } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@operis/constants";
import { useOutsideClickDetector } from "@operis/hooks";
import { useTranslation } from "@operis/i18n";
import { Logo } from "@operis/propel/emoji-icon-picker";
import { LinkIcon, ArchiveIcon, ChevronRightIcon } from "@operis/propel/icons";
import { IconButton } from "@operis/propel/icon-button";
import { Tooltip } from "@operis/propel/tooltip";
import { DropIndicator, DragHandle, ControlLink } from "@operis/ui";
import { SidebarRowQuickMenu } from "@/components/sidebar/sidebar-row-quick-menu";
import { cn } from "@operis/utils";
import { SidebarTreeGuide } from "@/components/sidebar/sidebar-tree-guide";
import {
  SIDEBAR_NAV_ACTIVE_INDICATOR_CLASS,
  SIDEBAR_TREE_CHILD_INDENT_CLASS,
  SIDEBAR_TREE_CHEVRON_CLASS,
  sidebarNestedNavItemClass,
} from "@/components/sidebar/sidebar-styles";
// components
import { DEFAULT_TAB_KEY, getTabUrl } from "@/components/navigation/tab-navigation-utils";
import { useTabPreferences } from "@/components/navigation/use-tab-preferences";
import { MoveProjectBoardModal } from "@/components/board/move-project-board-modal";
import { LeaveProjectModal } from "@/components/project/leave-project-modal";
import { ProjectFavoriteStar } from "@/components/project/project-favorite-star";
import { PublishProjectModal } from "@/components/project/publish-project/modal";
import { useProjectFavorite } from "@/hooks/use-project-favorite";
import { ENABLE_WORKSPACE_BOARDS } from "@/constants/enable-boards";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useProjectNavigationPreferences } from "@/hooks/use-navigation-preferences";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web imports
import { useNavigationItems } from "@/plane-web/components/navigations";
import { ProjectNavigationRoot } from "@/plane-web/components/sidebar";
// local imports
import { HIGHLIGHT_CLASS, highlightIssueOnDrop } from "../../issues/issue-layouts/utils";

type Props = {
  projectId: string;
  handleCopyText: () => void;
  handleOnProjectDrop?: (
    sourceId: string | undefined,
    destinationId: string | undefined,
    shouldDropAtEnd: boolean
  ) => void;
  projectListType: "JOINED" | "FAVORITES";
  disableDrag?: boolean;
  disableDrop?: boolean;
  isLastChild: boolean;
  renderInExtendedSidebar?: boolean;
  /** Dentro da árvore Boards → Projetos: mostra atribuir/mover board e indentação extra */
  showBoardActions?: boolean;
  nestedUnderBoard?: boolean;
  /** Agrupa DnD na sidebar (ex.: projetos só reordenam dentro do mesmo board) */
  dragInstanceId?: string;
};

export const SidebarProjectsListItem = observer(function SidebarProjectsListItem(props: Props) {
  const {
    projectId,
    handleCopyText,
    disableDrag,
    disableDrop,
    isLastChild,
    handleOnProjectDrop,
    projectListType,
    renderInExtendedSidebar = false,
    showBoardActions = false,
    nestedUnderBoard = false,
    dragInstanceId = "PROJECTS",
  } = props;
  // store hooks
  const { t } = useTranslation();
  const { getPartialProjectById } = useProject();
  const { isMobile } = usePlatformOS();
  const { allowPermissions } = useUserPermissions();
  const { getIsProjectListOpen, toggleProjectListOpen } = useCommandPalette();
  const { preferences: projectPreferences } = useProjectNavigationPreferences();
  const { isExtendedProjectSidebarOpened, toggleExtendedProjectSidebar, toggleAnySidebarDropdown } = useAppTheme();

  // states
  const [leaveProjectModalOpen, setLeaveProjectModal] = useState(false);
  const [publishModalOpen, setPublishModal] = useState(false);
  const [isMoveBoardModalOpen, setIsMoveBoardModalOpen] = useState(false);
  const [isMenuActive, setIsMenuActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isProjectListOpen = getIsProjectListOpen(projectId);
  const [instruction, setInstruction] = useState<"DRAG_OVER" | "DRAG_BELOW" | undefined>(undefined);
  // refs
  const actionSectionRef = useRef<HTMLDivElement | null>(null);
  const projectRef = useRef<HTMLDivElement | null>(null);
  const dragHandleRef = useRef<HTMLButtonElement | null>(null);
  // router
  const { workspaceSlug, projectId: URLProjectId } = useParams();
  const router = useRouter();
  // derived values
  const project = getPartialProjectById(projectId);

  // Get available navigation items for this project
  const navigationItems = useNavigationItems({
    workspaceSlug: workspaceSlug.toString(),
    projectId,
    project,
    allowPermissions,
  });
  const availableTabKeys = navigationItems.map((item) => item.key);

  // Get preferences from hook
  const { tabPreferences } = useTabPreferences(workspaceSlug.toString(), projectId);
  const defaultTabKey = tabPreferences.defaultTab;
  // Validate that the default tab is available
  const validatedDefaultTabKey = availableTabKeys.includes(defaultTabKey) ? defaultTabKey : DEFAULT_TAB_KEY;
  const defaultTabUrl = project ? getTabUrl(workspaceSlug.toString(), project.id, validatedDefaultTabKey) : "";

  // toggle project list open
  const setIsProjectListOpen = useCallback(
    (value: boolean) => toggleProjectListOpen(projectId, value),
    [projectId, toggleProjectListOpen]
  );
  // auth
  const isAdmin = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug.toString(),
    project?.id
  );
  const isAuthorized = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug.toString(),
    project?.id
  );
  const isWorkspaceAdmin = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.WORKSPACE,
    workspaceSlug.toString()
  );
  const canOpenProjectSettings = isAuthorized || isWorkspaceAdmin;

  const handleLeaveProject = () => {
    setLeaveProjectModal(true);
  };

  useEffect(() => {
    const element = projectRef.current;
    const dragHandleElement = dragHandleRef.current;

    if (!element) return;

    return combine(
      draggable({
        element,
        canDrag: () => !disableDrag,
        dragHandle: dragHandleElement ?? undefined,
        getInitialData: () => ({ id: projectId, dragInstanceId }),
        onDragStart: () => {
          setIsDragging(true);
        },
        onDrop: () => {
          setIsDragging(false);
        },
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          // Add a custom drag image
          setCustomNativeDragPreview({
            getOffset: pointerOutsideOfPreview({ x: "0px", y: "0px" }),
            render: ({ container }) => {
              const root = createRoot(container);
              root.render(
                <div className="flex items-center rounded-sm bg-surface-1 p-1 pr-2 text-13">
                  <div className="grid size-4 flex-shrink-0 place-items-center">
                    {project && <Logo logo={project?.logo_props} />}
                  </div>
                  <p className="truncate text-secondary">{project?.name}</p>
                </div>
              );
              return () => root.unmount();
            },
            nativeSetDragImage,
          });
        },
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) =>
          !disableDrop && source?.data?.id !== projectId && source?.data?.dragInstanceId === dragInstanceId,
        getData: ({ input, element }) => {
          const data = { id: projectId };

          // attach instruction for last in list
          return attachInstruction(data, {
            input,
            element,
            currentLevel: 0,
            indentPerLevel: 0,
            mode: isLastChild ? "last-in-group" : "standard",
          });
        },
        onDrag: ({ self }) => {
          const extractedInstruction = extractInstruction(self?.data)?.type;
          // check if the highlight is to be shown above or below
          setInstruction(
            extractedInstruction
              ? extractedInstruction === "reorder-below" && isLastChild
                ? "DRAG_BELOW"
                : "DRAG_OVER"
              : undefined
          );
        },
        onDragLeave: () => {
          setInstruction(undefined);
        },
        onDrop: ({ self, source }) => {
          setInstruction(undefined);
          const extractedInstruction = extractInstruction(self?.data)?.type;
          const currentInstruction = extractedInstruction
            ? extractedInstruction === "reorder-below" && isLastChild
              ? "DRAG_BELOW"
              : "DRAG_OVER"
            : undefined;
          if (!currentInstruction) return;

          const sourceId = source?.data?.id as string | undefined;
          const destinationId = self?.data?.id as string | undefined;

          handleOnProjectDrop?.(sourceId, destinationId, currentInstruction === "DRAG_BELOW");

          highlightIssueOnDrop(`sidebar-${sourceId}-${projectListType}`);
        },
      })
    );
  }, [projectId, isLastChild, projectListType, handleOnProjectDrop, disableDrag, disableDrop, dragInstanceId]);

  useEffect(() => {
    if (isMenuActive) toggleAnySidebarDropdown(true);
    else toggleAnySidebarDropdown(false);
  }, [isMenuActive, toggleAnySidebarDropdown]);

  useOutsideClickDetector(actionSectionRef, () => setIsMenuActive(false));
  useOutsideClickDetector(projectRef, () => projectRef?.current?.classList?.remove(HIGHLIGHT_CLASS));

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (URLProjectId === project?.id) {
      setIsProjectListOpen(true);
      // Scroll to active project
      if (projectRef.current) {
        timeoutId = setTimeout(() => {
          if (projectRef.current) {
            scrollIntoView(projectRef.current, {
              behavior: "smooth",
              block: "center",
              scrollMode: "if-needed",
            });
          }
        }, 200);
      }
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [URLProjectId, project?.id, setIsProjectListOpen]);

  if (!project) return null;

  const isAccordionMode = projectPreferences.navigationMode === "ACCORDION";
  const showProjectSubNav = isAccordionMode || nestedUnderBoard;

  const handleItemClick = () => {
    if (showProjectSubNav) {
      setIsProjectListOpen(!isProjectListOpen);
    } else {
      router.push(defaultTabUrl);
    }
    // close the extended sidebar if it is open
    if (isExtendedProjectSidebarOpened && !showProjectSubNav) {
      toggleExtendedProjectSidebar(false);
    }
  };

  const isCurrentProject = URLProjectId === project?.id;
  const shouldHighlightProject = nestedUnderBoard ? isCurrentProject : isCurrentProject && !showProjectSubNav;

  const projectNameClassName = "min-w-0 flex-1 truncate text-13 font-medium text-secondary";

  const projectNameLabel = (
    <Tooltip isMobile={isMobile} tooltipContent={project.name} position="right">
      <p className={projectNameClassName}>{project.name}</p>
    </Tooltip>
  );

  const canManageBoard =
    ENABLE_WORKSPACE_BOARDS &&
    showBoardActions &&
    Boolean(workspaceSlug) &&
    (allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT, workspaceSlug.toString(), projectId) ||
      allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE, workspaceSlug.toString()));

  const { canFavorite, isFavorite, handleAddToFavorites, handleRemoveFromFavorites } = useProjectFavorite(
    workspaceSlug?.toString(),
    projectId
  );

  const projectQuickMenuItems = useMemo(
    () => [
      {
        key: "move_board",
        label: !project.board_id ? t("boards.assign_to_board") : t("boards.move_to_board"),
        onClick: () => setIsMoveBoardModalOpen(true),
        shouldRender: canManageBoard,
      },
      {
        key: "favorite",
        label: (
          <span className="flex items-center gap-2">
            <Star
              className={cn("size-3.5", {
                "fill-yellow-500 stroke-yellow-500": isFavorite,
              })}
            />
            <span>{isFavorite ? t("remove_from_favorites") : t("add_to_favorites")}</span>
          </span>
        ),
        onClick: isFavorite ? handleRemoveFromFavorites : handleAddToFavorites,
        shouldRender: canFavorite,
      },
      {
        key: "publish",
        label: (
          <span className="flex items-center gap-2">
            <Share2 className="size-3.5 stroke-[1.5]" />
            <span>{t("publish_project")}</span>
          </span>
        ),
        onClick: () => setPublishModal(true),
        shouldRender: isAdmin,
      },
      {
        key: "copy_link",
        label: (
          <span className="flex items-center gap-2">
            <LinkIcon className="size-3.5 stroke-[1.5]" />
            <span>{t("copy_link")}</span>
          </span>
        ),
        onClick: handleCopyText,
        shouldRender: true,
      },
      {
        key: "archives",
        label: (
          <span className="flex items-center gap-2">
            <ArchiveIcon className="size-3.5 stroke-[1.5]" />
            <span>{t("archives")}</span>
          </span>
        ),
        onClick: () => {
          router.push(`/${workspaceSlug}/projects/${project?.id}/archives/issues`);
        },
        shouldRender: isAuthorized,
      },
      {
        key: "settings",
        label: (
          <span className="flex items-center gap-2">
            <Settings className="size-3.5 stroke-[1.5]" />
            <span>{t("settings")}</span>
          </span>
        ),
        onClick: () => {
          router.push(`/${workspaceSlug}/settings/projects/${project?.id}`);
        },
        shouldRender: canOpenProjectSettings,
      },
      {
        key: "leave",
        label: (
          <span className="flex items-center gap-2">
            <LogOut className="size-3.5 stroke-[1.5]" />
            <span>{t("leave_project")}</span>
          </span>
        ),
        onClick: handleLeaveProject,
        shouldRender: !isAuthorized && Boolean(project?.member_role),
      },
    ],
    [
      canFavorite,
      canManageBoard,
      canOpenProjectSettings,
      handleAddToFavorites,
      handleCopyText,
      handleLeaveProject,
      handleRemoveFromFavorites,
      isAdmin,
      isAuthorized,
      isFavorite,
      project?.board_id,
      project?.id,
      project?.member_role,
      router,
      t,
      workspaceSlug,
    ]
  );

  return (
    <>
      {canManageBoard && workspaceSlug && (
        <MoveProjectBoardModal
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId}
          projectName={project.name}
          currentBoardId={project.board_id}
          isOpen={isMoveBoardModalOpen}
          onClose={() => setIsMoveBoardModalOpen(false)}
        />
      )}
      <PublishProjectModal isOpen={publishModalOpen} projectId={projectId} onClose={() => setPublishModal(false)} />
      <LeaveProjectModal project={project} isOpen={leaveProjectModalOpen} onClose={() => setLeaveProjectModal(false)} />
      <Disclosure
        key={`${project.id}_${URLProjectId}`}
        defaultOpen={isProjectListOpen}
        as="div"
        className={cn(nestedUnderBoard && "pl-0")}
      >
        <div
          id={`sidebar-${projectId}-${projectListType}`}
          className={cn("relative", {
            "bg-layer-1 opacity-60": isDragging,
          })}
          ref={projectRef}
        >
          <DropIndicator classNames="absolute top-0" isVisible={instruction === "DRAG_OVER"} />
          <div
            className={cn(
              nestedUnderBoard
                ? sidebarNestedNavItemClass(shouldHighlightProject)
                : "group/project-item relative flex w-full items-center rounded-md px-2 py-1.5 text-primary hover:bg-layer-transparent-hover",
              {
                "bg-surface-2": !nestedUnderBoard && isMenuActive,
                "bg-layer-transparent-active": !nestedUnderBoard && shouldHighlightProject,
              }
            )}
            id={`${project?.id}`}
          >
            {nestedUnderBoard && shouldHighlightProject ? (
              <span className={SIDEBAR_NAV_ACTIVE_INDICATOR_CLASS} aria-hidden />
            ) : null}
            {!disableDrag && (
              <Tooltip
                isMobile={isMobile}
                tooltipContent={
                  project.sort_order === null ? t("join_the_project_to_rearrange") : t("drag_to_rearrange")
                }
                position="top-end"
                disabled={isDragging}
              >
                <button
                  type="button"
                  className={cn(
                    "absolute top-1/2 -left-3 hidden -translate-y-1/2 cursor-grab items-center justify-center rounded-sm text-placeholder group-hover/project-item:flex",
                    {
                      "cursor-not-allowed opacity-60": project.sort_order === null,
                      "cursor-grabbing": isDragging,
                      flex: isMenuActive || renderInExtendedSidebar,
                    }
                  )}
                  ref={dragHandleRef}
                >
                  <DragHandle className="bg-transparent" />
                </button>
              </Tooltip>
            )}
            <>
              <ControlLink
                href={defaultTabUrl}
                className={cn("flex min-w-0 flex-grow", nestedUnderBoard ? "" : "truncate")}
                onClick={handleItemClick}
              >
                {showProjectSubNav ? (
                  <Disclosure.Button
                    as="button"
                    type="button"
                    className={cn(
                      "flex w-full min-w-0 flex-grow gap-1.5 text-left select-none",
                      nestedUnderBoard ? "items-start" : "items-center"
                    )}
                    aria-label={
                      isProjectListOpen
                        ? t("aria_labels.projects_sidebar.close_project_menu")
                        : t("aria_labels.projects_sidebar.open_project_menu")
                    }
                  >
                    <div className="grid size-4 shrink-0 place-items-center">
                      <Logo logo={project.logo_props} size={16} />
                    </div>
                    {projectNameLabel}
                  </Disclosure.Button>
                ) : (
                  <div
                    className={cn(
                      "flex w-full min-w-0 flex-grow gap-1.5 text-left select-none",
                      nestedUnderBoard ? "items-start" : "items-center"
                    )}
                  >
                    <div className="grid size-4 shrink-0 place-items-center">
                      <Logo logo={project.logo_props} size={16} />
                    </div>
                    {projectNameLabel}
                  </div>
                )}
              </ControlLink>
              <div ref={actionSectionRef} className="flex items-center gap-1">
                <ProjectFavoriteStar
                  workspaceSlug={workspaceSlug?.toString()}
                  projectId={projectId}
                  className={cn(
                    "pointer-events-none opacity-0 group-hover/project-item:pointer-events-auto group-hover/project-item:opacity-100",
                    {
                      "pointer-events-auto opacity-100": isMenuActive || isFavorite,
                    }
                  )}
                  buttonClassName="size-6"
                  iconClassName="size-3.5"
                />
                <SidebarRowQuickMenu
                  items={projectQuickMenuItems}
                  ariaLabel={t("aria_labels.projects_sidebar.toggle_quick_actions_menu")}
                  className={cn(
                    "pointer-events-none opacity-0 group-hover/project-item:pointer-events-auto group-hover/project-item:opacity-100",
                    {
                      "pointer-events-auto opacity-100": isMenuActive,
                    }
                  )}
                  onOpenChange={setIsMenuActive}
                />
                {showProjectSubNav && (
                  <IconButton
                    variant="ghost"
                    size="sm"
                    icon={ChevronRightIcon}
                    onClick={() => setIsProjectListOpen(!isProjectListOpen)}
                    className={cn(
                      nestedUnderBoard ? cn("text-secondary", SIDEBAR_TREE_CHEVRON_CLASS) : "hidden text-placeholder group-hover/project-item:inline-flex",
                      {
                        "inline-flex opacity-100": isMenuActive || isProjectListOpen || !nestedUnderBoard,
                      }
                    )}
                    iconClassName={cn("transition-transform", {
                      "rotate-90": isProjectListOpen,
                    })}
                    aria-label={t(
                      isProjectListOpen
                        ? "aria_labels.projects_sidebar.close_project_menu"
                        : "aria_labels.projects_sidebar.open_project_menu"
                    )}
                  />
                )}
              </div>
            </>
          </div>
          {showProjectSubNav && (
            <Transition
              show={isProjectListOpen}
              enter="transition duration-100 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition duration-75 ease-out"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            >
              {isProjectListOpen && (
                <Disclosure.Panel
                  as="div"
                  className={cn(
                    "relative mt-1 mb-1.5 flex flex-col gap-0.5",
                    SIDEBAR_TREE_CHILD_INDENT_CLASS
                  )}
                >
                  <SidebarTreeGuide />
                  <ProjectNavigationRoot workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
                </Disclosure.Panel>
              )}
            </Transition>
          )}
          {isLastChild && <DropIndicator isVisible={instruction === "DRAG_BELOW"} />}
        </div>
      </Disclosure>
    </>
  );
});
