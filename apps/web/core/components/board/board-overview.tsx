import { useState } from "react";
import useSWR from "swr";
import { ChevronDown, ChevronRight, ExternalLink, Plus } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { Logo } from "@operis/propel/emoji-icon-picker";
import type { IBoard, IBoardMeta, TPartialProject } from "@operis/types";
import { cn } from "@operis/utils";
import { BoardOverviewDashboard } from "@/components/board/board-overview-dashboard";
import { CreateProjectModal } from "@/components/project/create-project-modal";
import { ProjectFavoriteStar } from "@/components/project/project-favorite-star";
import { useAppRouter } from "@/hooks/use-app-router";
import { BoardService } from "@/services/board/board.service";

type Props = {
  workspaceSlug: string;
  board: IBoard;
  projectIds: string[];
  getPartialProjectById: (projectId: string) => TPartialProject | undefined;
  canCreateProject: boolean;
};

const boardService = new BoardService();

function DashboardSkeleton() {
  const pulse = "animate-pulse bg-layer-2";

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn("h-[5.5rem] rounded-lg border border-subtle bg-layer-1", pulse)} />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className={cn("h-6 w-40 rounded-sm", pulse)} />
            <div className={cn("h-[300px] rounded-md border border-subtle bg-layer-1", pulse)} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BoardOverview(props: Props) {
  const { workspaceSlug, board, projectIds, getPartialProjectById, canCreateProject } = props;
  const { t } = useTranslation();
  const router = useAppRouter();

  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [projectsExpanded, setProjectsExpanded] = useState(false);

  const { data: meta, isLoading: isMetaLoading, error: metaError } = useSWR<IBoardMeta>(
    workspaceSlug && board.slug ? `BOARD_META_${workspaceSlug}_${board.slug}` : null,
    () => boardService.getBoardMeta(workspaceSlug, board.slug),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const handleOpenProject = (projectId: string) => {
    router.push(`/${workspaceSlug}/projects/${projectId}/issues`);
  };

  return (
    <>
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        workspaceSlug={workspaceSlug}
        data={{ board_id: board.id }}
      />
      <div className="h-full w-full overflow-y-auto bg-transparent">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-6 py-5">
          <section aria-label={t("boards.overview_kpis_title")}>
            {metaError ? (
              <p className="rounded-md border border-subtle bg-layer-1 px-4 py-3 text-13 text-tertiary">
                {t("boards.overview_meta_unavailable")}
              </p>
            ) : isMetaLoading || !meta ? (
              <DashboardSkeleton />
            ) : (
              <BoardOverviewDashboard meta={meta} workspaceSlug={workspaceSlug} />
            )}
          </section>

          <section className="overflow-hidden rounded-lg border border-subtle bg-layer-1 shadow-sm">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-layer-transparent-hover"
              onClick={() => setProjectsExpanded((v) => !v)}
              aria-expanded={projectsExpanded}
            >
              <div>
                <h2 className="text-13 font-semibold text-primary">{t("boards.overview_projects_title")}</h2>
                <p className="mt-0.5 text-12 text-secondary">
                  {t("boards.overview_projects_hint", { count: projectIds.length })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {canCreateProject && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCreateProjectOpen(true);
                    }}
                  >
                    <Plus className="size-3.5" />
                    {t("boards.add_project")}
                  </Button>
                )}
                {projectsExpanded ? (
                  <ChevronDown className="size-4 text-tertiary" />
                ) : (
                  <ChevronRight className="size-4 text-tertiary" />
                )}
              </div>
            </button>

            {projectsExpanded ? (
              <>
                {projectIds.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 border-t border-subtle/60 px-4 py-12 text-center">
                    <p className="text-13 text-tertiary">{t("boards.empty_projects")}</p>
                    {canCreateProject && (
                      <Button variant="primary" size="sm" onClick={() => setIsCreateProjectOpen(true)}>
                        {t("boards.add_project")}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto border-t border-subtle/60">
                    <table className="w-full min-w-[520px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-subtle/60 bg-layer-2/50 text-11 font-medium uppercase tracking-wide text-tertiary">
                          <th className="px-4 py-2.5 font-medium">{t("boards.overview_table_project")}</th>
                          <th className="hidden w-28 px-4 py-2.5 font-medium sm:table-cell">
                            {t("boards.overview_table_key")}
                          </th>
                          <th className="w-32 px-4 py-2.5 text-right font-medium">
                            {t("boards.overview_table_actions")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectIds.map((projectId) => {
                          const project = getPartialProjectById(projectId);
                          if (!project) return null;
                          return (
                            <tr
                              key={projectId}
                              className="group border-b border-subtle/60 last:border-b-0 hover:bg-layer-transparent-hover"
                            >
                              <td className="px-4 py-2.5">
                                <button
                                  type="button"
                                  className="flex max-w-full items-center gap-2.5 text-left"
                                  onClick={() => handleOpenProject(projectId)}
                                >
                                  <span className="grid size-8 shrink-0 place-items-center rounded border border-subtle bg-layer-2">
                                    <Logo logo={project.logo_props} size={18} />
                                  </span>
                                  <span
                                    className={cn(
                                      "min-w-0 truncate text-13 font-medium text-primary group-hover:text-accent-primary"
                                    )}
                                  >
                                    {project.name}
                                  </span>
                                </button>
                              </td>
                              <td className="hidden px-4 py-2.5 sm:table-cell">
                                <span className="inline-flex rounded bg-layer-2 px-1.5 py-0.5 font-mono text-11 text-tertiary">
                                  {project.identifier}
                                </span>
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center justify-end gap-1">
                                  <ProjectFavoriteStar
                                    workspaceSlug={workspaceSlug}
                                    projectId={projectId}
                                    buttonClassName="size-7"
                                    iconClassName="size-3.5"
                                  />
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="h-7 gap-1 px-2 text-12"
                                    onClick={() => handleOpenProject(projectId)}
                                  >
                                    {t("boards.open_project")}
                                    <ExternalLink className="size-3 opacity-60" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : null}
          </section>
        </div>
      </div>
    </>
  );
}
