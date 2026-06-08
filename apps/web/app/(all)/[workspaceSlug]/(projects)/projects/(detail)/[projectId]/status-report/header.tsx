import { observer } from "mobx-react";
import { useParams } from "react-router";
import { FileText } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Header } from "@operis/ui";
import { useStatusReportHub } from "@/components/project/status-report/status-report-hub-context";
import { ProjectFeaturePageHeader, ProjectFeaturePageTitle } from "@/components/project/project-feature-page-header";
import { ProjectHubPrimaryAction } from "@/components/project/project-hub-toolbar";
import { useStatusReportCapabilities } from "@/hooks/use-status-report-capabilities";
import { useProject } from "@/hooks/store/use-project";

export const ProjectStatusReportHeader = observer(function ProjectStatusReportHeader() {
  const { reportId, projectId } = useParams();
  const { t } = useTranslation();
  const { loader, currentProjectDetails } = useProject();
  const hub = useStatusReportHub();
  const { canManage: canManageReports } = useStatusReportCapabilities(projectId?.toString());
  const canManage = !reportId && canManageReports();

  const isListPage = !reportId;

  return (
    <ProjectFeaturePageHeader>
      <Header.LeftItem>
        <ProjectFeaturePageTitle
          title={reportId ? t("project.status_report.detail_breadcrumb") : t("project.status_report.title")}
          subtitle={isListPage ? t("project.status_report.subtitle") : undefined}
          icon={<FileText className="size-4 text-secondary" strokeWidth={1.75} />}
          isLoading={loader === "init-loader"}
        />
      </Header.LeftItem>
      {isListPage && canManage && hub ? (
        <Header.RightItem>
          <ProjectHubPrimaryAction
            onClick={hub.openCreateModal}
            disabled={!currentProjectDetails}
          >
            <span className="sm:hidden">{t("add")}</span>
            <span className="hidden sm:inline">{t("project.status_report.create_button")}</span>
          </ProjectHubPrimaryAction>
        </Header.RightItem>
      ) : null}
    </ProjectFeaturePageHeader>
  );
});
