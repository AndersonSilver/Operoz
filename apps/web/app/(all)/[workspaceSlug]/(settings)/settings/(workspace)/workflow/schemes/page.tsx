import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { useTranslation } from "@operoz/i18n";
import {
  WorkflowSchemeSettingsList,
  WorkflowSchemesHero,
} from "@/components/settings/workspace/workflow/workflow-scheme-settings-list";
import { useWorkflow } from "@/hooks/store/use-workflow";
import { useAppRouter } from "@/hooks/use-app-router";
import { Loader } from "@operoz/ui";
import type { Route } from "./+types/page";

function WorkflowSchemesSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  const { t } = useTranslation();
  const router = useAppRouter();
  const { fetchWorkspaceSchemes, createScheme, deleteScheme, workspaceSchemes, fetchedSchemeMap } = useWorkflow();
  const [isCreating, setIsCreating] = useState(false);

  useSWR(`WORKSPACE_WORKFLOW_SCHEMES_${workspaceSlug}`, () => fetchWorkspaceSchemes(workspaceSlug));

  const isLoading = !fetchedSchemeMap[workspaceSlug];
  const schemes = workspaceSchemes ?? [];

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const scheme = await createScheme(workspaceSlug, {
        name: t("workspace_settings.settings.workflow.schemes.default_name"),
        is_default: schemes.length === 0,
      });
      router.push(`/${workspaceSlug}/settings/workflow/schemes/${scheme.id}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <WorkflowSchemesHero schemeCount={schemes.length} onCreate={handleCreate} isCreating={isCreating} />
      {isLoading ? (
        <Loader className="grid w-full gap-3 md:grid-cols-2">
          <Loader.Item height="120px" />
          <Loader.Item height="120px" />
        </Loader>
      ) : (
        <WorkflowSchemeSettingsList
          workspaceSlug={workspaceSlug}
          schemes={schemes}
          onDelete={(id) => deleteScheme(workspaceSlug, id)}
        />
      )}
    </div>
  );
}

export default observer(WorkflowSchemesSettingsPage);
