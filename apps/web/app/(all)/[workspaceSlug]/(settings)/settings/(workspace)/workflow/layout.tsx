import { Outlet, useParams } from "react-router";
import { observer } from "mobx-react";
import { useTranslation } from "@operoz/i18n";
import { EUserPermissions, EUserPermissionsLevel } from "@operoz/constants";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { WorkflowSettingsTabs } from "@/components/settings/workspace/workflow/workflow-settings-tabs";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
import { WorkflowWorkspaceSettingsHeader } from "./header";

function WorkflowSettingsLayout() {
  const { workspaceSlug = "" } = useParams();
  const { currentWorkspace } = useWorkspace();
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { t } = useTranslation();

  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  if (workspaceUserInfo && !isAdmin) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${t("workspace_settings.settings.workflow.title")}`
    : undefined;

  return (
    <SettingsContentWrapper hugging header={<WorkflowWorkspaceSettingsHeader />}>
      <PageHead title={pageTitle} />
      <div className="flex w-full flex-col gap-6">
        <WorkflowSettingsTabs workspaceSlug={workspaceSlug} />
        <Outlet />
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(WorkflowSettingsLayout);
