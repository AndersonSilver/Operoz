import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { useTranslation } from "@operoz/i18n";
import { WorkflowSettingsHero } from "@/components/settings/workspace/workflow/workflow-settings-hero";
import { WorkflowSettingsList } from "@/components/settings/workspace/workflow/workflow-settings-list";
import { useWorkflow } from "@/hooks/store/use-workflow";
import { useAppRouter } from "@/hooks/use-app-router";
import { Loader } from "@operoz/ui";
import type { Route } from "./+types/page";

function WorkflowSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  const { t } = useTranslation();
  const router = useAppRouter();
  const { fetchWorkspaceWorkflows, createWorkflow, deleteWorkflow, workspaceWorkflows, fetchedWorkflowMap } =
    useWorkflow();
  const [isCreating, setIsCreating] = useState(false);

  useSWR(`WORKSPACE_WORKFLOWS_${workspaceSlug}`, () => fetchWorkspaceWorkflows(workspaceSlug));

  const isLoading = !fetchedWorkflowMap[workspaceSlug];
  const workflows = workspaceWorkflows ?? [];

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const workflow = await createWorkflow(workspaceSlug, {
        name: t("workspace_settings.settings.workflow.default_name"),
        description: "",
      });
      router.push(`/${workspaceSlug}/settings/workflow/${workflow.id}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <WorkflowSettingsHero workflowCount={workflows.length} onCreate={handleCreate} isCreating={isCreating} />
      {isLoading ? (
        <Loader className="grid w-full gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Loader.Item height="120px" />
          <Loader.Item height="120px" />
          <Loader.Item height="120px" />
        </Loader>
      ) : (
        <WorkflowSettingsList
          workspaceSlug={workspaceSlug}
          workflows={workflows}
          onDelete={(id) => deleteWorkflow(workspaceSlug, id)}
        />
      )}
    </div>
  );
}

export default observer(WorkflowSettingsPage);
