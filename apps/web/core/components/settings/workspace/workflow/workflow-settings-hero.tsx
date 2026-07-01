import { GitBranch, Plus } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";

type Props = {
  workflowCount: number;
  onCreate: () => void;
  isCreating?: boolean;
};

export function WorkflowSettingsHero(props: Props) {
  const { workflowCount, onCreate, isCreating = false } = props;
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 rounded-md border border-subtle bg-layer-1 p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <GitBranch className="size-4 text-accent-primary" strokeWidth={1.75} />
          <h2 className="text-16 font-medium text-primary">{t("workspace_settings.settings.workflow.title")}</h2>
        </div>
        <p className="text-13 text-secondary">{t("workspace_settings.settings.workflow.description")}</p>
        <p className="text-11 text-tertiary">
          {t("workspace_settings.settings.workflow.count", { count: workflowCount })}
        </p>
      </div>
      <Button variant="primary" onClick={onCreate} disabled={isCreating}>
        <Plus className="size-3.5" strokeWidth={1.75} />
        {isCreating
          ? t("workspace_settings.settings.workflow.creating")
          : t("workspace_settings.settings.workflow.add_workflow")}
      </Button>
    </div>
  );
}
