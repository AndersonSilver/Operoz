import { useState, type ReactNode } from "react";
import { intersection } from "lodash-es";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { Download, FileJson, FileSpreadsheet, FileText } from "lucide-react";
import { EUserPermissions, EUserPermissionsLevel, EXPORTERS_LIST } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { TWorkItemFilterExpression } from "@operoz/types";
import { cn } from "@operoz/ui";
import { CustomSearchSelect } from "@operoz/ui";
import { useProject } from "@/hooks/store/use-project";
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { ProjectExportService } from "@/services/project/project-export.service";
import "./workspace-exports-settings.css";

type Props = {
  workspaceSlug: string;
  provider: string | null;
  mutateServices: () => void;
};
type FormData = {
  provider: (typeof EXPORTERS_LIST)[0];
  project: string[];
  multiple: boolean;
  filters: TWorkItemFilterExpression;
};

const projectExportService = new ProjectExportService();

const FORMAT_ICONS = {
  csv: FileText,
  xlsx: FileSpreadsheet,
  json: FileJson,
} as const;

function FieldLabel(props: { children: ReactNode; hint?: string }) {
  const { children, hint } = props;

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-12 font-medium text-primary">{children}</span>
      {hint && <span className="text-11 text-tertiary">{hint}</span>}
    </div>
  );
}

export const ExportForm = observer(function ExportForm(props: Props) {
  const { workspaceSlug, mutateServices } = props;
  const [exportLoading, setExportLoading] = useState(false);

  const { allowPermissions } = useUserPermissions();
  const { data: user, canPerformAnyCreateAction, projectsWithCreatePermissions } = useUser();
  const { workspaceProjectIds, getProjectById } = useProject();
  const { t } = useTranslation();

  const { handleSubmit, control } = useForm<FormData>({
    defaultValues: {
      provider: EXPORTERS_LIST[0],
      project: [],
      multiple: false,
      filters: {},
    },
  });

  const hasProjects = workspaceProjectIds && workspaceProjectIds.length > 0;
  const isMember = allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.WORKSPACE);
  const wsProjectIdsWithCreatePermisisons = projectsWithCreatePermissions
    ? intersection(workspaceProjectIds, Object.keys(projectsWithCreatePermissions))
    : [];
  const options = wsProjectIdsWithCreatePermisisons?.map((projectId) => {
    const projectDetails = getProjectById(projectId);

    return {
      value: projectDetails?.id,
      query: `${projectDetails?.name} ${projectDetails?.identifier}`,
      content: (
        <div className="flex items-center gap-2">
          <span className="flex-shrink-0 text-10 text-secondary">{projectDetails?.identifier}</span>
          <span className="truncate">{projectDetails?.name}</span>
        </div>
      ),
    };
  });
  const fieldsDisabled = !isMember && (!hasProjects || !canPerformAnyCreateAction);

  async function ExportCSVToMail(formData: FormData) {
    setExportLoading(true);
    if (workspaceSlug && user) {
      const payload = {
        provider: formData.provider.provider,
        project: formData.project,
        multiple: formData.project.length > 1,
        rich_filters: formData.filters,
      };
      try {
        await projectExportService.csvExport(workspaceSlug, payload);
        mutateServices();
        setExportLoading(false);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("workspace_settings.settings.exports.modal.toasts.success.title"),
          message: t("workspace_settings.settings.exports.modal.toasts.success.message", {
            entity:
              formData.provider.provider === "csv"
                ? "CSV"
                : formData.provider.provider === "xlsx"
                  ? "Excel"
                  : formData.provider.provider === "json"
                    ? "JSON"
                    : "",
          }),
        });
      } catch (_error) {
        setExportLoading(false);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("error"),
          message: t("workspace_settings.settings.exports.modal.toasts.error.message"),
        });
      }
    } else {
      setExportLoading(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(ExportCSVToMail)(e);
      }}
      className="workspace-exports-form-panel flex flex-col overflow-hidden rounded-xl border border-subtle bg-layer-1"
    >
      <div className="workspace-exports-hero-dot-grid relative border-b border-subtle bg-gradient-to-br from-accent-subtle/20 via-transparent to-transparent px-5 py-5 lg:px-6">
        <p className="text-11 font-semibold tracking-wide text-tertiary uppercase">
          {t("workspace_settings.settings.exports.new_export")}
        </p>
        <p className="mt-1 text-12 text-tertiary">{t("workspace_settings.settings.exports.new_export_hint")}</p>
      </div>

      <div className="flex flex-1 flex-col px-5 py-5 lg:px-6 lg:py-6">
        <div className="workspace-exports-form-fields">
          <div className="flex flex-col gap-2">
            <FieldLabel hint={t("workspace_settings.settings.exports.exporting_projects_hint")}>
              {t("workspace_settings.settings.exports.exporting_projects")}
            </FieldLabel>
            <Controller
              control={control}
              name="project"
              disabled={fieldsDisabled}
              render={({ field: { value, onChange } }) => (
                <CustomSearchSelect
                  value={value ?? []}
                  onChange={(val: string[]) => onChange(val)}
                  options={options}
                  input
                  label={
                    value && value.length > 0
                      ? value
                          .map((projectId) => {
                            const projectDetails = getProjectById(projectId);

                            return projectDetails?.identifier;
                          })
                          .join(", ")
                      : t("workspace_settings.settings.exports.all_projects")
                  }
                  optionsClassName="max-w-48 sm:max-w-[532px]"
                  placement="bottom-end"
                  multiple
                />
              )}
            />
          </div>

          <div className="workspace-exports-format-field flex flex-col gap-2">
            <FieldLabel>{t("workspace_settings.settings.exports.format")}</FieldLabel>
            <Controller
              control={control}
              name="provider"
              disabled={fieldsDisabled}
              render={({ field: { value, onChange } }) => (
                <div
                  className="workspace-exports-format-options"
                  role="group"
                  aria-label={t("workspace_settings.settings.exports.format")}
                >
                  {EXPORTERS_LIST.map((service) => {
                    const Icon = FORMAT_ICONS[service.provider as keyof typeof FORMAT_ICONS] ?? FileText;
                    const isActive = value.provider === service.provider;

                    return (
                      <button
                        key={service.provider}
                        type="button"
                        disabled={fieldsDisabled}
                        data-active={isActive}
                        className="workspace-exports-format-option"
                        onClick={() => onChange(service)}
                      >
                        <Icon
                          className={cn("size-3.5", isActive ? "text-accent-primary" : "text-tertiary")}
                          strokeWidth={1.75}
                        />
                        {t(service.i18n_title)}
                      </button>
                    );
                  })}
                </div>
              )}
            />
          </div>
        </div>
      </div>

      <footer className="workspace-exports-form-footer">
        <Button
          variant="primary"
          type="submit"
          loading={exportLoading}
          prependIcon={<Download className="size-3.5" strokeWidth={1.75} />}
        >
          {exportLoading ? `${t("workspace_settings.settings.exports.exporting")}...` : t("export")}
        </Button>
      </footer>
    </form>
  );
});
