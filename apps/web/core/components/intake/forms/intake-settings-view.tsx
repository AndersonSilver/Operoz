import { useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { SPACE_BASE_PATH, SPACE_BASE_URL } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { TOAST_TYPE, setPromiseToast, setToast } from "@operis/propel/toast";
import type { TIntakeForm } from "@operis/types";
import { Loader } from "@operis/ui";
import { copyTextToClipboard } from "@operis/utils";
import { useProject } from "@/hooks/store/use-project";
import { intakeFormService } from "@/services/intake/intake-form.service";
import { IntakeEmptyState } from "./intake-empty-state";
import { IntakeFormEditorModal } from "./intake-form-editor-modal";
import { IntakeFormTable } from "./intake-form-table";
import { IntakeSettingsAside } from "./intake-settings-aside";
import { IntakeSettingsHero } from "./intake-settings-hero";
import "./intake-settings.css";

type Props = {
  workspaceSlug: string;
  projectId: string;
  boardSlug?: string;
  intakeEnabled: boolean;
};

function buildPublicFormUrl(anchor: string): string {
  const base = (SPACE_BASE_URL.trim() || (typeof window !== "undefined" ? window.location.origin : "")) + SPACE_BASE_PATH;
  return `${base.replace(/\/$/, "")}/forms/${anchor}`;
}

export const IntakeSettingsView = observer(function IntakeSettingsView(props: Props) {
  const { workspaceSlug, projectId, boardSlug, intakeEnabled } = props;
  const { t } = useTranslation();
  const { getProjectById, updateProject } = useProject();
  const [editorForm, setEditorForm] = useState<TIntakeForm | null | "new">(null);
  const [creating, setCreating] = useState(false);

  const {
    data: forms = [],
    mutate,
    isLoading,
    error: formsError,
  } = useSWR(intakeEnabled ? `INTAKE_FORMS_${workspaceSlug}_${projectId}` : null, () =>
    intakeFormService.list(workspaceSlug, projectId)
  );

  const publishedCount = useMemo(() => forms.filter((form) => form.is_published).length, [forms]);

  const sortedForms = useMemo(
    () => [...forms].sort((a, b) => (b.updated_at ?? b.created_at ?? "").localeCompare(a.updated_at ?? a.created_at ?? "")),
    [forms]
  );

  const needsOnboarding = !intakeEnabled || sortedForms.length === 0 || publishedCount === 0;

  const handleToggleIntake = useCallback(() => {
    const project = getProjectById(projectId);
    if (!project) return;
    const promise = updateProject(workspaceSlug, projectId, { inbox_view: !project.inbox_view });
    setPromiseToast(promise, {
      loading: t("common.updating"),
      success: { title: t("common.success"), message: () => t("project_settings.features.intake.setup.toggle_success") },
      error: { title: t("common.error.label"), message: () => t("something_went_wrong") },
    });
  }, [getProjectById, projectId, t, updateProject, workspaceSlug]);

  const handleCreate = useCallback(async () => {
    setCreating(true);
    try {
      const created = await intakeFormService.create(workspaceSlug, projectId, {
        name: t("project_settings.features.intake.forms.default_name"),
        header_title: t("project_settings.features.intake.forms.default_header"),
        fields: [
          {
            id: "field-name",
            field_type: "name",
            label: t("project_settings.features.intake.forms.field_types.name"),
            required: true,
            form_span: "full",
            maps_to: "name",
          },
          {
            id: "field-description",
            field_type: "description",
            label: t("project_settings.features.intake.forms.field_types.description"),
            required: false,
            form_span: "full",
            maps_to: "description_html",
          },
        ],
        defaults: {},
        submit_message: t("project_settings.features.intake.forms.default_submit_message"),
      });
      await mutate();
      setEditorForm(created);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("project_settings.features.intake.forms.created"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("something_went_wrong"),
      });
    } finally {
      setCreating(false);
    }
  }, [mutate, projectId, t, workspaceSlug]);

  const handleDelete = useCallback(
    async (form: TIntakeForm) => {
      if (!window.confirm(t("project_settings.features.intake.forms.delete_confirm"))) return;
      try {
        await intakeFormService.destroy(workspaceSlug, projectId, form.id);
        await mutate();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("toast.success"),
          message: t("project_settings.features.intake.forms.deleted"),
        });
      } catch {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: t("something_went_wrong"),
        });
      }
    },
    [mutate, projectId, t, workspaceSlug]
  );

  const handleCopyLink = useCallback(
    (form: TIntakeForm) => {
      if (!form.is_published) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: t("project_settings.features.intake.forms.publish_before_copy"),
        });
        return;
      }
      void copyTextToClipboard(buildPublicFormUrl(form.anchor)).then(() =>
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("toast.success"),
          message: t("project_settings.features.intake.forms.link_copied"),
        })
      );
    },
    [t]
  );

  const formsContent = !intakeEnabled ? (
    <IntakeEmptyState variant="disabled" />
  ) : isLoading ? (
    <Loader className="space-y-2">
      <Loader.Item height="56px" />
      <Loader.Item height="56px" />
    </Loader>
  ) : formsError ? (
    <div className="rounded-xl border border-danger-subtle bg-danger-subtle px-5 py-4 text-13 text-danger-primary">
      {t("project_settings.features.intake.forms.load_error")}
    </div>
  ) : sortedForms.length === 0 ? (
    <IntakeEmptyState variant="empty" creating={creating} onCreate={() => void handleCreate()} />
  ) : (
    <IntakeFormTable
      forms={sortedForms}
      buildUrl={buildPublicFormUrl}
      onEdit={setEditorForm}
      onCopyLink={handleCopyLink}
      onDelete={(form) => void handleDelete(form)}
    />
  );

  return (
    <div className="intake-settings-page">
      <IntakeSettingsHero
        intakeEnabled={intakeEnabled}
        creating={creating}
        onCreate={() => void handleCreate()}
      />

      <div className="intake-settings-body">
        <main className="intake-settings-main">
          <div className="intake-main-panel">
            <div className="intake-main-panel-header">
              <div>
                <h2 className="text-15 font-semibold text-primary">
                  {t("project_settings.features.intake.forms.title")}
                </h2>
                <p className="mt-1 text-13 leading-relaxed text-secondary">
                  {t("project_settings.features.intake.forms.list_lead")}
                </p>
              </div>
            </div>
            <div className="intake-main-panel-body">{formsContent}</div>
          </div>
        </main>

        <IntakeSettingsAside
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          intakeEnabled={intakeEnabled}
          formCount={forms.length}
          publishedCount={publishedCount}
          showSetupSteps={needsOnboarding}
          onToggle={handleToggleIntake}
        />
      </div>

      {editorForm ? (
        <IntakeFormEditorModal
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          boardSlug={boardSlug}
          form={editorForm === "new" ? null : editorForm}
          onClose={() => setEditorForm(null)}
          onSaved={async () => {
            await mutate();
            setEditorForm(null);
          }}
        />
      ) : null}
    </div>
  );
});
