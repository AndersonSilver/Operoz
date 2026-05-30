import { observer } from "mobx-react";
import { FileText } from "lucide-react";
import { useParams } from "react-router";
import { useTranslation } from "@operis/i18n";
import { Breadcrumbs, Header } from "@operis/ui";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
import { CommonProjectBreadcrumbs } from "@/plane-web/components/breadcrumbs/common";

export const ProjectStatusReportHeader = observer(function ProjectStatusReportHeader() {
  const router = useAppRouter();
  const { workspaceSlug, projectId, reportId } = useParams();
  const { t } = useTranslation();
  const { loader } = useProject();

  const listHref = `/${workspaceSlug}/projects/${projectId}/status-report`;

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs onBack={router.back} isLoading={loader === "init-loader"}>
          <CommonProjectBreadcrumbs workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()} />
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                label={t("project.status_report.title")}
                href={listHref}
                icon={<FileText className="size-4 text-tertiary" strokeWidth={1.75} />}
                isLast={!reportId}
              />
            }
            isLast={!reportId}
          />
          {reportId && (
            <Breadcrumbs.Item
              component={<BreadcrumbLink label={t("project.status_report.detail_breadcrumb")} isLast />}
              isLast
            />
          )}
        </Breadcrumbs>
      </Header.LeftItem>
    </Header>
  );
});
