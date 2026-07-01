import type { IBoardModule, TIssue, TPartialProject } from "@operoz/types";

export const BOARD_PROJECT_BLOCK_PREFIX = "board-project:";
export const BOARD_MODULE_BLOCK_PREFIX = "board-module:";

export const getBoardProjectBlockId = (projectId: string) => `${BOARD_PROJECT_BLOCK_PREFIX}${projectId}`;

export const getBoardModuleBlockId = (moduleId: string) => `${BOARD_MODULE_BLOCK_PREFIX}${moduleId}`;

export const isBoardProjectBlockId = (blockId: string) => blockId.startsWith(BOARD_PROJECT_BLOCK_PREFIX);

export const isBoardModuleBlockId = (blockId: string) => blockId.startsWith(BOARD_MODULE_BLOCK_PREFIX);

export const isBoardGroupBlockId = (blockId: string) => isBoardProjectBlockId(blockId) || isBoardModuleBlockId(blockId);

export const getProjectIdFromBoardBlock = (blockId: string) => blockId.slice(BOARD_PROJECT_BLOCK_PREFIX.length);

export const getModuleIdFromBoardBlock = (blockId: string) => blockId.slice(BOARD_MODULE_BLOCK_PREFIX.length);

export type TBoardProjectGanttRow = {
  id: string;
  name: string;
  sort_order: number | null;
  start_date?: string;
  target_date?: string;
  project_id: string;
  isBoardProjectRow: true;
};

export type TBoardModuleGanttRow = {
  id: string;
  name: string;
  sort_order: number | null;
  start_date?: string;
  target_date?: string;
  project_id: string;
  isBoardModuleRow: true;
};

export const computeProjectScheduleRange = (
  issueIds: string[],
  getIssueById: (id: string) => TIssue | undefined
): { start_date?: string; target_date?: string } => {
  let start_date: string | undefined;
  let target_date: string | undefined;

  for (const issueId of issueIds) {
    const issue = getIssueById(issueId);
    if (!issue) continue;

    if (issue.start_date) {
      if (!start_date || issue.start_date < start_date) start_date = issue.start_date;
    }
    if (issue.target_date) {
      if (!target_date || issue.target_date > target_date) target_date = issue.target_date;
    }
  }

  return { start_date, target_date };
};

/** Board projects from store + any project present in the loaded issue list. */
export const resolveBoardTimelineProjectIds = (
  boardProjectIds: string[],
  issueIds: string[],
  getIssueById: (id: string) => TIssue | undefined
): string[] => {
  const merged = new Set(boardProjectIds);
  for (const issueId of issueIds) {
    const projectId = getIssueById(issueId)?.project_id;
    if (projectId) merged.add(projectId);
  }
  return Array.from(merged);
};

const issueBelongsToModule = (issue: TIssue | undefined, moduleId: string) =>
  Boolean(issue?.module_ids?.includes(moduleId));

export const buildBoardGroupedGanttBlockIds = (
  projectIds: string[],
  issueIds: string[],
  getIssueById: (id: string) => TIssue | undefined,
  collapsedProjectIds: Set<string>,
  getProjectName?: (projectId: string) => string | undefined,
  modulesByProject?: Record<string, IBoardModule[]>,
  collapsedModuleIds?: Set<string>
): string[] => {
  const sortedProjectIds = [...projectIds].sort((a, b) => {
    const nameA = getProjectName?.(a) ?? a;
    const nameB = getProjectName?.(b) ?? b;
    return nameA.localeCompare(nameB);
  });
  const issuesByProject: Record<string, string[]> = {};

  for (const issueId of issueIds) {
    const projectId = getIssueById(issueId)?.project_id;
    if (!projectId) continue;
    if (!issuesByProject[projectId]) issuesByProject[projectId] = [];
    issuesByProject[projectId].push(issueId);
  }

  const blockIds: string[] = [];

  for (const projectId of sortedProjectIds) {
    blockIds.push(getBoardProjectBlockId(projectId));
    if (collapsedProjectIds.has(projectId)) continue;

    const projectIssueIds = issuesByProject[projectId] ?? [];
    const projectModules = modulesByProject?.[projectId] ?? [];
    const assignedIssueIds = new Set<string>();

    if (projectModules.length > 0) {
      const sortedModules = [...projectModules].sort((a, b) => a.sort_order - b.sort_order);

      for (const boardModule of sortedModules) {
        blockIds.push(getBoardModuleBlockId(boardModule.id));

        // If module is collapsed, skip adding its issues
        if (collapsedModuleIds?.has(boardModule.id)) {
          // Still mark issues as assigned so they don't appear under "unassigned"
          for (const issueId of projectIssueIds) {
            const issue = getIssueById(issueId);
            if (issueBelongsToModule(issue, boardModule.id)) assignedIssueIds.add(issueId);
          }
          continue;
        }

        for (const issueId of projectIssueIds) {
          if (assignedIssueIds.has(issueId)) continue;
          const issue = getIssueById(issueId);
          if (!issueBelongsToModule(issue, boardModule.id)) continue;
          blockIds.push(issueId);
          assignedIssueIds.add(issueId);
        }
      }

      for (const issueId of projectIssueIds) {
        if (!assignedIssueIds.has(issueId)) blockIds.push(issueId);
      }
    } else {
      blockIds.push(...projectIssueIds);
    }
  }

  return blockIds;
};

export const resolveBoardProjectGanttRow = (
  projectId: string,
  childIssueIds: string[],
  getIssueById: (id: string) => TIssue | undefined,
  getPartialProjectById: (projectId: string) => TPartialProject | undefined,
  getProjectIdentifierById?: (projectId: string) => string | undefined
): TBoardProjectGanttRow => {
  const project = getPartialProjectById(projectId);
  const range = computeProjectScheduleRange(childIssueIds, getIssueById);
  const identifier = getProjectIdentifierById?.(projectId);
  const fallbackName = identifier ?? projectId.slice(0, 8);

  return {
    id: projectId,
    name: project?.name ?? fallbackName,
    sort_order: null,
    start_date: range.start_date ?? project?.start_date ?? undefined,
    target_date: range.target_date ?? project?.target_date ?? undefined,
    project_id: projectId,
    isBoardProjectRow: true,
  };
};

export const resolveBoardModuleGanttRow = (module: IBoardModule): TBoardModuleGanttRow => ({
  id: module.id,
  name: module.name,
  sort_order: null,
  start_date: module.start_date ?? undefined,
  target_date: module.target_date ?? undefined,
  project_id: module.project_id,
  isBoardModuleRow: true,
});

export const groupBoardModulesByProject = (modules: IBoardModule[]): Record<string, IBoardModule[]> => {
  const grouped: Record<string, IBoardModule[]> = {};

  for (const boardModule of modules) {
    if (!grouped[boardModule.project_id]) grouped[boardModule.project_id] = [];
    grouped[boardModule.project_id].push(boardModule);
  }

  return grouped;
};
