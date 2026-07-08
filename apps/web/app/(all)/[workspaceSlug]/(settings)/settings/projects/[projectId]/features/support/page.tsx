import { observer } from "mobx-react";
import { Link } from "react-router";
import { ExternalLink } from "lucide-react";
// plane imports
import { useTranslation } from "@operoz/i18n";
import { cn } from "@operoz/utils";
// components
import { EUserPermissions, EUserPermissionsLevel } from "@operoz/constants";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { ProjectSettingsFeatureControlItem } from "@/components/settings/project/content/feature-control-item";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import type { Route } from "./+types/page";
import { FeaturesSupportProjectSettingsHeader } from "./header";

function FeaturesSupportSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId } = params;
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentProjectDetails } = useProject();
  const { t } = useTranslation();

  const pageTitle = currentProjectDetails?.name
    ? `${currentProjectDetails.name} settings - ${t("project_settings.features.support.short_title")}`
    : undefined;
  const canPerformProjectAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);
  const boardSlug = currentProjectDetails?.board?.slug;

  if (workspaceUserInfo && !canPerformProjectAdminActions) {
    return <NotAuthorizedView section="settings" isProjectView className="h-auto" />;
  }

  return (
    <SettingsContentWrapper header={<FeaturesSupportProjectSettingsHeader />}>
      <PageHead title={pageTitle} />
      <section className="w-full">
        <SettingsHeading
          title={t("project_settings.features.support.title")}
          description={t("project_settings.features.support.description")}
        />
        <div className="mt-7 space-y-4">
          <ProjectSettingsFeatureControlItem
            title={t("project_settings.features.support.toggle_title")}
            description={t("project_settings.features.support.toggle_description")}
            featureProperty="support_view"
            projectId={projectId}
            value={!!currentProjectDetails?.support_view}
            workspaceSlug={workspaceSlug}
          />

          {boardSlug ? (
            <div className="rounded-xl border border-subtle bg-surface-1 px-5 py-4">
              <h3 className="text-14 font-medium text-primary">
                {t("project_settings.features.support.board_link_title")}
              </h3>
              <p className="mt-1 text-13 leading-relaxed text-secondary">
                {t("project_settings.features.support.board_link_description")}
              </p>
              <Link
                to={`/${workspaceSlug}/settings/boards/${boardSlug}/sustentacao/`}
                className={cn(
                  "mt-3 inline-flex items-center gap-1 text-caption-md-medium",
                  "text-link-primary underline hover:text-link-primary-hover"
                )}
              >
                {t("project_settings.features.support.board_link_cta")}
                <ExternalLink className="size-3.5" />
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    </SettingsContentWrapper>
  );
}

export default observer(FeaturesSupportSettingsPage);
