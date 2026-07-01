import { observer } from "mobx-react";
import { useTranslation } from "@operoz/i18n";
import { PageHead } from "@/components/core/page-title";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { ProjectStatusReportList } from "@/components/project/status-report/project-status-report-list";
import { useProject } from "@/hooks/store/use-project";
import type { Route } from "./+types/page";

function ProjectStatusReportPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId } = params;
  const { t } = useTranslation();
  const { getProjectById } = useProject();
  const project = getProjectById(projectId);

  if (!project) {
    return (
      <>
        <PageHead title={t("project.status_report.title")} />
        <div className="flex h-full items-center justify-center">
          <LogoSpinner />
        </div>
      </>
    );
  }

  const pageTitle = `${project.name} - ${t("project.status_report.title")}`;

  return (
    <>
      <PageHead title={pageTitle} />
      <ProjectStatusReportList workspaceSlug={workspaceSlug} project={project} />
    </>
  );
}

export default observer(ProjectStatusReportPage);
