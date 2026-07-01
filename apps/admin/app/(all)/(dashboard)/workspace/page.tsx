import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { LayoutGrid, Loader as LoaderIcon, Shield } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { setPromiseToast } from "@operoz/propel/toast";
import type { TInstanceConfigurationKeys } from "@operoz/types";
import { Loader } from "@operoz/ui";
import { PageWrapper } from "@/components/common/page-wrapper";
import { AdminCreateCard, AdminSettingsPanel, AdminToggleCard } from "@/components/settings/admin-settings-panel";
import { AdminSectionHeader } from "@/components/settings/admin-section-header";
import { WorkspaceListItem } from "@/components/workspace/list-item";
import { useInstance, useWorkspace } from "@/hooks/store";
import type { Route } from "./+types/page";

const WorkspaceManagementPage = observer(function WorkspaceManagementPage(_props: Route.ComponentProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { formattedConfig, fetchInstanceConfigurations, updateInstanceConfigurations } = useInstance();
  const {
    workspaceIds,
    loader: workspaceLoader,
    paginationInfo,
    fetchWorkspaces,
    fetchNextWorkspaces,
  } = useWorkspace();

  const disableWorkspaceCreation = formattedConfig?.DISABLE_WORKSPACE_CREATION ?? "";
  const hasNextPage = paginationInfo?.next_page_results && paginationInfo?.next_cursor !== undefined;
  const creationBlocked = Boolean(parseInt(disableWorkspaceCreation));

  useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());
  useSWR("INSTANCE_WORKSPACES", () => fetchWorkspaces());

  const updateConfig = async (key: TInstanceConfigurationKeys, value: string) => {
    setIsSubmitting(true);

    const updateConfigPromise = updateInstanceConfigurations({ [key]: value });

    setPromiseToast(updateConfigPromise, {
      loading: t("god_mode.common.config_saving"),
      success: {
        title: t("god_mode.common.success"),
        message: () => t("god_mode.common.config_saved"),
      },
      error: {
        title: t("god_mode.common.error"),
        message: () => t("god_mode.common.config_save_failed"),
      },
    });

    await updateConfigPromise
      .then(() => setIsSubmitting(false))
      .catch((err) => {
        console.error(err);
        setIsSubmitting(false);
      });
  };

  return (
    <PageWrapper
      size="lg"
      header={{
        icon: LayoutGrid,
        title: t("god_mode.pages.workspace.title"),
        description: t("god_mode.pages.workspace.description"),
        highlights: [
          { label: t("god_mode.nav.workspace.name"), icon: LayoutGrid, tone: "accent" },
          { label: t("god_mode.pages.workspace.create_button"), icon: Shield, tone: "success" },
        ],
      }}
    >
      <div className="space-y-6">
        {formattedConfig ? (
          <AdminSettingsPanel
            title={t("god_mode.pages.workspace.prevent_creation_title")}
            description={t("god_mode.pages.workspace.prevent_creation_desc")}
            icon={Shield}
            iconClassName="text-warning-primary"
            accentClassName="bg-warning-primary"
            glowActive={creationBlocked}
          >
            <AdminToggleCard
              label={t("god_mode.pages.workspace.prevent_creation_title")}
              description={t("god_mode.pages.workspace.prevent_creation_desc")}
              value={creationBlocked}
              onChange={() => updateConfig("DISABLE_WORKSPACE_CREATION", creationBlocked ? "0" : "1")}
              disabled={isSubmitting}
            />
          </AdminSettingsPanel>
        ) : (
          <Loader>
            <Loader.Item height="120px" width="100%" />
          </Loader>
        )}

        {workspaceLoader !== "init-loader" ? (
          <section>
            <AdminSectionHeader
              title={t("god_mode.pages.workspace.title")}
              count={workspaceIds.length}
              hint={t("god_mode.pages.workspace.list_hint")}
            />

            <div className="admin-workspace-grid">
              <AdminCreateCard
                label={t("god_mode.pages.workspace.create_button")}
                hint={t("god_mode.pages.workspace.create_description")}
                href="/workspace/create"
                onClick={() => undefined}
              />
              {workspaceIds.map((workspaceId) => (
                <WorkspaceListItem key={workspaceId} workspaceId={workspaceId} />
              ))}
            </div>

            {hasNextPage && (
              <div className="mt-4 flex justify-center border-t border-subtle pt-4">
                <Button
                  variant="link"
                  size="lg"
                  onClick={() => fetchNextWorkspaces()}
                  disabled={workspaceLoader === "pagination"}
                >
                  {t("god_mode.pages.workspace.load_more")}
                  {workspaceLoader === "pagination" && <LoaderIcon className="h-3 w-3 animate-spin" />}
                </Button>
              </div>
            )}
          </section>
        ) : (
          <Loader className="space-y-4 py-4">
            <Loader.Item height="120px" width="100%" />
            <Loader.Item height="200px" width="100%" />
          </Loader>
        )}
      </div>
    </PageWrapper>
  );
});

export const meta: Route.MetaFunction = () => [{ title: "Workspace Management - God Mode" }];

export default WorkspaceManagementPage;
