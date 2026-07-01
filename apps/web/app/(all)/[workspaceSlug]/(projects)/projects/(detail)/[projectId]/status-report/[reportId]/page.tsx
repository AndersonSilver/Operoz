import { observer } from "mobx-react";
import { useTranslation } from "@operoz/i18n";
import { PageHead } from "@/components/core/page-title";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { ProjectStatusReportDetail } from "@/components/project/status-report/project-status-report-detail";
import { useProject } from "@/hooks/store/use-project";
import type { Route } from "./+types/page";

function ProjectStatusReportDetailPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId, reportId } = params;
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
      <ProjectStatusReportDetail workspaceSlug={workspaceSlug} project={project} reportId={reportId} />
    </>
  );
}

export default observer(ProjectStatusReportDetailPage);
