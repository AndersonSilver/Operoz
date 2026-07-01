import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { EUserPermissions, EUserPermissionsLevel } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { WorkflowEditor } from "@/components/settings/workspace/workflow";
import { useWorkflow } from "@/hooks/store/use-workflow";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import { Loader } from "@operoz/ui";
import type { TWorkflowGraph } from "@operoz/types";
import type { Route } from "./+types/page";
import { WorkflowEditorSettingsHeader } from "./header";
import "@/components/settings/workspace/workflow/workflow-editor.css";

const EMPTY_GRAPH: TWorkflowGraph = { nodes: [], edges: [] };

function WorkflowEditorSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, workflowId } = params;
  const { t } = useTranslation();
  const router = useAppRouter();
  const { currentWorkspace } = useWorkspace();
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const {
    fetchWorkflow,
    getWorkflowGraph,
    saveWorkflowGraph,
    publishWorkflow,
    updateWorkflow,
    deleteWorkflow,
    getWorkflowById,
    graphByWorkflow,
  } = useWorkflow();

  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  const { isLoading } = useSWR(isAdmin ? `WORKFLOW_EDITOR_${workspaceSlug}_${workflowId}` : null, async () => {
    await fetchWorkflow(workspaceSlug, workflowId);
    await getWorkflowGraph(workspaceSlug, workflowId);
  });

  const workflow = getWorkflowById(workflowId);
  const graph = graphByWorkflow[workflowId] ?? EMPTY_GRAPH;

  const handleSave = useCallback(
    async (nextGraph: TWorkflowGraph) => {
      await saveWorkflowGraph(workspaceSlug, workflowId, nextGraph);
    },
    [saveWorkflowGraph, workspaceSlug, workflowId]
  );

  const handlePublish = useCallback(async () => {
    await publishWorkflow(workspaceSlug, workflowId);
    await fetchWorkflow(workspaceSlug, workflowId);
  }, [publishWorkflow, fetchWorkflow, workspaceSlug, workflowId]);

  const handleUpdateMetadata = useCallback(
    async (data: { name: string; description: string }) => {
      await updateWorkflow(workspaceSlug, workflowId, data);
      await fetchWorkflow(workspaceSlug, workflowId);
    },
    [fetchWorkflow, updateWorkflow, workflowId, workspaceSlug]
  );

  const handleDelete = useCallback(async () => {
    await deleteWorkflow(workspaceSlug, workflowId);
    router.push(`/${workspaceSlug}/settings/workflow`);
  }, [deleteWorkflow, router, workflowId, workspaceSlug]);

  const pageTitle = useMemo(() => {
    if (!currentWorkspace?.name || !workflow?.name) return undefined;
    return `${currentWorkspace.name} - ${workflow.name}`;
  }, [currentWorkspace?.name, workflow?.name]);

  if (workspaceUserInfo && !isAdmin) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  if (isLoading || !workflow) {
    return (
      <SettingsContentWrapper hugging header={<WorkflowEditorSettingsHeader />}>
        <Loader className="w-full">
          <Loader.Item height="480px" />
        </Loader>
      </SettingsContentWrapper>
    );
  }

  return (
    <SettingsContentWrapper hugging header={<WorkflowEditorSettingsHeader workflowName={workflow.name} />}>
      <PageHead title={pageTitle} />
      <div className="flex h-[calc(100vh-12rem)] min-h-[480px] w-full flex-col">
        <WorkflowEditor
          workspaceSlug={workspaceSlug}
          workflowId={workflowId}
          workflowName={workflow.name}
          workflowDescription={workflow.description}
          graph={graph}
          onSave={handleSave}
          onPublish={handlePublish}
          onUpdateMetadata={handleUpdateMetadata}
          onDelete={handleDelete}
          isDraft={workflow.is_draft}
        />
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(WorkflowEditorSettingsPage);
