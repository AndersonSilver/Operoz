import type { MouseEvent } from "react";
import { useRef } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { Info } from "lucide-react";
import { MODULE_STATUS } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { ModuleStatusIcon } from "@operis/propel/icons";
import { ControlLink } from "@operis/ui";
import { cn, generateQueryParams } from "@operis/utils";
import { MODULE_LIST_ROW_GRID } from "@/components/modules/module-list-header";
import { ModuleListItemAction, ModuleQuickActions } from "@/components/modules";
import { useModule } from "@/hooks/store/use-module";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  moduleId: string;
};

export const ModuleListItem = observer(function ModuleListItem(props: Props) {
  const { moduleId } = props;
  const parentRef = useRef<HTMLDivElement>(null);
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { getModuleById } = useModule();
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();

  const moduleDetails = getModuleById(moduleId);

  if (!moduleDetails) return null;

  const moduleTotalIssues =
    moduleDetails.backlog_issues +
    moduleDetails.unstarted_issues +
    moduleDetails.started_issues +
    moduleDetails.completed_issues +
    moduleDetails.cancelled_issues;

  const moduleCompletedIssues = moduleDetails.completed_issues;
  const completionPercentage =
    moduleTotalIssues > 0 ? (moduleCompletedIssues / moduleTotalIssues) * 100 : 0;
  const progress = Number.isNaN(completionPercentage) ? 0 : Math.floor(completionPercentage);

  const issueLabel =
    moduleTotalIssues === 0
      ? t("project_modules.list.issues_none")
      : moduleTotalIssues === moduleCompletedIssues
        ? t("project_modules.list.issues_all", { count: moduleTotalIssues })
        : t("project_modules.list.issues_progress", {
            completed: moduleCompletedIssues,
            total: moduleTotalIssues,
          });

  const statusConfig = MODULE_STATUS.find((s) => s.value === moduleDetails.status);
  const itemLink = `/${workspaceSlug?.toString()}/projects/${moduleDetails.project_id}/modules/${moduleDetails.id}`;

  const openModuleOverview = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const query = generateQueryParams(searchParams, ["peekModule"]);
    if (searchParams.has("peekModule") && searchParams.get("peekModule") === moduleId) {
      router.push(`${pathname}?${query}`);
    } else {
      router.push(`${pathname}?${query && `${query}&`}peekModule=${moduleId}`);
    }
  };

  const handleItemClick = moduleDetails.archived_at ? openModuleOverview : undefined;

  return (
    <div
      ref={parentRef}
      className="group border-b border-subtle last:border-b-0 transition-colors hover:bg-layer-transparent-hover"
    >
      <div className={cn("flex items-center gap-3 px-4 py-2.5", MODULE_LIST_ROW_GRID)}>
        <ControlLink
          className="flex min-w-0 items-center gap-3 overflow-hidden"
          href={itemLink}
          target="_self"
          onClick={(e) => {
            if (handleItemClick) handleItemClick(e as unknown as MouseEvent<HTMLButtonElement>);
            else router.push(itemLink);
          }}
        >
          <span
            className="grid size-8 shrink-0 place-items-center rounded-sm border border-subtle bg-layer-2"
            style={
              statusConfig
                ? { boxShadow: `inset 3px 0 0 0 ${statusConfig.color}` }
                : undefined
            }
          >
            {statusConfig ? (
              <ModuleStatusIcon status={moduleDetails.status} className="size-4" />
            ) : null}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-13 font-medium text-primary">{moduleDetails.name}</span>
              <button
                type="button"
                onClick={openModuleOverview}
                className={cn(
                  "shrink-0 rounded-sm p-0.5 text-tertiary hover:bg-layer-transparent-hover hover:text-secondary",
                  isMobile ? "inline-flex" : "hidden group-hover:inline-flex"
                )}
              >
                <Info className="size-3.5" strokeWidth={1.75} />
              </button>
            </div>
            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-11">
              <span
                className={cn("tabular-nums", moduleTotalIssues === 0 ? "text-secondary" : "text-tertiary")}
              >
                {issueLabel}
              </span>
              {moduleTotalIssues > 0 ? (
                <>
                  <span className="text-subtle">·</span>
                  <span className="tabular-nums">{progress}%</span>
                  <span className="h-1 min-w-[3rem] max-w-[4.5rem] flex-1 overflow-hidden rounded-full bg-layer-2 sm:flex-none">
                    <span
                      className="block h-full rounded-full bg-accent-primary opacity-90"
                      style={{ width: `${Math.max(progress, progress > 0 ? 8 : 0)}%` }}
                    />
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </ControlLink>

        <ModuleListItemAction moduleId={moduleId} moduleDetails={moduleDetails} parentRef={parentRef} />

        {workspaceSlug && projectId ? (
          <div className="flex shrink-0 justify-end lg:hidden">
            <ModuleQuickActions
              parentRef={parentRef}
              moduleId={moduleId}
              projectId={projectId.toString()}
              workspaceSlug={workspaceSlug.toString()}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
});
