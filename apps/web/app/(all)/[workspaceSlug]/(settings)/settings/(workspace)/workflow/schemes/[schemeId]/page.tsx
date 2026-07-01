import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { EUserPermissions, EUserPermissionsLevel } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { WorkflowSchemeEditor } from "@/components/settings/workspace/workflow/workflow-scheme-editor";
import { useWorkflow } from "@/hooks/store/use-workflow";
import { useProject } from "@/hooks/store/use-project";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import { Loader } from "@operoz/ui";
import type { Route } from "./+types/page";
import type { TProject } from "@operoz/types";
import { WorkflowSchemeEditorSettingsHeader } from "./header";

function WorkflowSchemeEditorSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, schemeId } = params;
  const { t } = useTranslation();
  const router = useAppRouter();
  const { currentWorkspace } = useWorkspace();
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const {
    fetchScheme,
    fetchWorkspaceWorkflows,
    saveSchemeEntries,
    bootstrapSchemeFromProject,
    assignSchemeProjects,
    deleteScheme,
    getSchemeById,
    workspaceWorkflows,
  } = useWorkflow();
  const { fetchProjects, workspaceProjectIds, getProjectById } = useProject();

  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  const { isLoading } = useSWR(isAdmin ? `WORKFLOW_SCHEME_EDITOR_${workspaceSlug}_${schemeId}` : null, async () => {
    await Promise.all([
      fetchScheme(workspaceSlug, schemeId),
      fetchWorkspaceWorkflows(workspaceSlug),
      fetchProjects(workspaceSlug),
    ]);
  });

  const scheme = getSchemeById(schemeId);
  const workflows = workspaceWorkflows ?? [];
  const projects = useMemo(() => {
    const ids = workspaceProjectIds ?? [];
    return ids.map((id) => getProjectById(id)).filter((project): project is TProject => Boolean(project));
  }, [workspaceProjectIds, getProjectById]);

  const handleSaveEntries = useCallback(
    async (data: {
      name: string;
      is_default: boolean;
      entries: Array<{ issue_type: string | null; workflow: string }>;
    }) => saveSchemeEntries(workspaceSlug, schemeId, data),
    [saveSchemeEntries, workspaceSlug, schemeId]
  );

  const handleBootstrap = useCallback(
    async (data: { project_id: string; issue_type?: string | null; assign_project?: boolean }) => {
      await bootstrapSchemeFromProject(workspaceSlug, schemeId, data);
      await fetchScheme(workspaceSlug, schemeId);
      await fetchWorkspaceWorkflows(workspaceSlug);
      await fetchProjects(workspaceSlug);
    },
    [bootstrapSchemeFromProject, fetchProjects, fetchScheme, fetchWorkspaceWorkflows, schemeId, workspaceSlug]
  );

  const handleAssignProjects = useCallback(
    async (projectIds: string[]) => assignSchemeProjects(workspaceSlug, schemeId, projectIds),
    [assignSchemeProjects, schemeId, workspaceSlug]
  );

  const handleDeleteScheme = useCallback(async () => {
    await deleteScheme(workspaceSlug, schemeId);
    router.push(`/${workspaceSlug}/settings/workflow/schemes`);
  }, [deleteScheme, router, schemeId, workspaceSlug]);

  const pageTitle = useMemo(() => {
    if (!currentWorkspace?.name || !scheme?.name) return undefined;
    return `${currentWorkspace.name} - ${scheme.name}`;
  }, [currentWorkspace?.name, scheme?.name]);

  if (workspaceUserInfo && !isAdmin) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  if (isLoading || !scheme) {
    return (
      <SettingsContentWrapper hugging header={<WorkflowSchemeEditorSettingsHeader />}>
        <Loader className="w-full">
          <Loader.Item height="480px" />
        </Loader>
      </SettingsContentWrapper>
    );
  }

  return (
    <SettingsContentWrapper hugging header={<WorkflowSchemeEditorSettingsHeader schemeName={scheme.name} />}>
      <PageHead title={pageTitle} />
      <WorkflowSchemeEditor
        workspaceSlug={workspaceSlug}
        scheme={scheme}
        workflows={workflows}
        projects={projects}
        onSaveEntries={handleSaveEntries}
        onBootstrap={handleBootstrap}
        onAssignProjects={handleAssignProjects}
        onDelete={handleDeleteScheme}
      />
    </SettingsContentWrapper>
  );
}

export default observer(WorkflowSchemeEditorSettingsPage);
