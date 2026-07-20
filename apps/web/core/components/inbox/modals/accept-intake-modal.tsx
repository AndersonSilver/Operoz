import { useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@operoz/i18n";
import type { TIssue } from "@operoz/types";
import { AlertModalCore, CustomSearchSelect } from "@operoz/ui";
import { Logo } from "@operoz/propel/emoji-icon-picker";
import { ProjectIcon } from "@operoz/propel/icons";
import { useProject } from "@/hooks/store/use-project";
import { useWorkspace } from "@/hooks/store/use-workspace";

type Props = {
  data: Partial<TIssue>;
  isOpen: boolean;
  onClose: () => void;
  /** Called with optional destinationProjectId for cross-project convert */
  onSubmit: (destinationProjectId?: string) => Promise<void>;
};

export const AcceptIntakeModal = observer(function AcceptIntakeModal(props: Props) {
  const { data, isOpen, onClose, onSubmit } = props;
  const { t } = useTranslation();
  const { workspaceProjectIds, getProjectById } = useProject();
  const { currentWorkspace } = useWorkspace();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [convertMode, setConvertMode] = useState(false);
  const [destinationProjectId, setDestinationProjectId] = useState<string | undefined>(undefined);

  const handleClose = () => {
    setConvertMode(false);
    setDestinationProjectId(undefined);
    onClose();
  };

  const handleAccept = async () => {
    setIsSubmitting(true);
    await onSubmit(convertMode ? destinationProjectId : undefined).finally(() => {
      setIsSubmitting(false);
      handleClose();
    });
  };

  const projectOptions = (workspaceProjectIds ?? []).map((projectId) => {
    const project = getProjectById(projectId);
    return {
      value: projectId,
      query: `${project?.name ?? ""} ${project?.identifier ?? ""}`,
      content: (
        <div className="flex max-w-[300px] items-center gap-2">
          {project?.logo_props ? <Logo logo={project.logo_props} size={16} /> : <ProjectIcon className="h-4 w-4" />}
          <span className="flex-grow truncate">{project?.name ?? projectId}</span>
        </div>
      ),
    };
  });

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleAccept}
      isSubmitting={isSubmitting || (convertMode && !destinationProjectId)}
      isOpen={isOpen}
      title={convertMode ? t("inbox_issue.modals.accept.convert_title") : t("inbox_issue.modals.accept.intake_title")}
      primaryButtonText={{
        loading: t("inbox_issue.modals.accept.loading"),
        default: convertMode ? t("inbox_issue.modals.accept.convert_confirm") : t("inbox_issue.actions.accept"),
      }}
      content={
        <div className="space-y-4 text-13">
          {!convertMode ? (
            <>
              <p className="text-secondary">{t("inbox_issue.modals.accept.intake_description")}</p>
              {data?.name ? <p className="font-medium text-primary">{data.name}</p> : null}
              <button
                type="button"
                onClick={() => setConvertMode(true)}
                className="text-xs text-custom-primary-100 hover:underline"
              >
                {t("inbox_issue.modals.accept.switch_to_convert")}
              </button>
            </>
          ) : (
            <>
              <p className="text-secondary">{t("inbox_issue.modals.accept.convert_description")}</p>
              {data?.name ? <p className="font-medium text-primary">{data.name}</p> : null}
              <CustomSearchSelect
                value={destinationProjectId}
                onChange={(val: string) => setDestinationProjectId(val)}
                options={projectOptions}
                label={
                  destinationProjectId ? (
                    (() => {
                      const p = getProjectById(destinationProjectId);
                      return (
                        <div className="flex items-center gap-2">
                          {p?.logo_props ? <Logo logo={p.logo_props} size={16} /> : <ProjectIcon className="h-4 w-4" />}
                          <span>{p?.name ?? destinationProjectId}</span>
                        </div>
                      );
                    })()
                  ) : (
                    <span className="text-secondary">{t("inbox_issue.modals.accept.select_project")}</span>
                  )
                }
                className="w-full"
              />
              <button
                type="button"
                onClick={() => {
                  setConvertMode(false);
                  setDestinationProjectId(undefined);
                }}
                className="text-xs text-secondary hover:underline"
              >
                {t("inbox_issue.modals.accept.switch_to_same")}
              </button>
            </>
          )}
        </div>
      }
    />
  );
});
