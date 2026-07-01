import type { ReactNode } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import type { EProjectFeatureKey } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import { Header } from "@operoz/ui";
import { cn } from "@operoz/utils";
import { BOARD_HUB_IMMERSIVE_TEXT_SHADOW, useBoardHubHasBackground } from "@/components/board/board-hub-background";
import { useProjectWorkSurface } from "@/components/project/project-view-shell";
import { useProject } from "@/hooks/store/use-project";
import { getProjectFeatureNavigation } from "@/plane-web/components/projects/navigation/helper";
type ProjectFeaturePageTitleProps = {
  featureKey?: EProjectFeatureKey;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  isLoading?: boolean;
  trailing?: ReactNode;
};

export const ProjectFeaturePageTitle = observer(function ProjectFeaturePageTitle(props: ProjectFeaturePageTitleProps) {
  const { featureKey, title, subtitle, icon, isLoading, trailing } = props;
  const { workspaceSlug, projectId } = useParams();
  const { t } = useTranslation();
  const { getPartialProjectById } = useProject();
  const insideWorkSurface = useProjectWorkSurface();
  const hasBoardWallpaper = useBoardHubHasBackground();

  const project = projectId ? getPartialProjectById(projectId.toString()) : undefined;

  let resolvedTitle = title;
  let resolvedIcon = icon;

  if (featureKey && project && workspaceSlug) {
    const item = getProjectFeatureNavigation(workspaceSlug.toString(), projectId!.toString(), project).find(
      (nav) => nav.key === featureKey
    );
    if (item) {
      resolvedTitle = item.i18n_key ? t(item.i18n_key) : item.name;
      if (!resolvedIcon && item.icon) {
        const Icon = item.icon;
        resolvedIcon = <Icon className="size-4 shrink-0 text-secondary" strokeWidth={1.75} />;
      }
    }
  }

  return (
    <div className={cn("flex min-w-0 items-center gap-3", hasBoardWallpaper && BOARD_HUB_IMMERSIVE_TEXT_SHADOW)}>
      {resolvedIcon ? (
        <span
          className={cn(
            "shadow-sm grid size-8 shrink-0 place-items-center rounded-md border border-subtle/60 bg-layer-1/70 backdrop-blur-sm",
            insideWorkSurface && "border-white/10"
          )}
          aria-hidden
        >
          {resolvedIcon}
        </span>
      ) : null}
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1
            className={cn(
              "text-15 truncate font-semibold tracking-tight text-primary",
              isLoading && "h-5 w-32 animate-pulse rounded-sm bg-layer-3"
            )}
          >
            {!isLoading ? resolvedTitle : null}
          </h1>
          {!isLoading && subtitle ? <p className="truncate text-13 text-tertiary">{subtitle}</p> : null}
        </div>
        {trailing}
      </div>
    </div>
  );
});

type ProjectFeaturePageHeaderProps = {
  children: ReactNode;
  className?: string;
};

export function ProjectFeaturePageHeader(props: ProjectFeaturePageHeaderProps) {
  const { children, className } = props;

  return <Header className={cn("!bg-transparent", className)}>{children}</Header>;
}

type ProjectFeaturePageActionsProps = {
  children: ReactNode;
  className?: string;
};

export function ProjectFeaturePageActions(props: ProjectFeaturePageActionsProps) {
  const { children, className } = props;

  return <div className={cn("flex flex-wrap items-center justify-end gap-2", className)}>{children}</div>;
}
