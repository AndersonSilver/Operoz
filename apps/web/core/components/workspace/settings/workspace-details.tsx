import { useEffect, useState, type ReactNode } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { Copy, Link2, Pencil, Save } from "lucide-react";
import { ORGANIZATION_SIZE, EUserPermissions, EUserPermissionsLevel } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { IWorkspace } from "@operis/types";
import { CustomSelect, Input } from "@operis/ui";
import { cn, copyUrlToClipboard, getFileURL, validateWorkspaceName } from "@operis/utils";
import { WorkspaceImageUploadModal } from "@/components/core/modals/workspace-image-upload-modal";
import { TimezoneSelect } from "@/components/global/timezone-select";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
import { WorkspaceDangerZonePanel } from "./workspace-danger-zone-panel";
import { WorkspaceGeneralSettingsHero } from "./workspace-general-settings-hero";
import "./workspace-general-settings.css";

const defaultValues: Partial<IWorkspace> = {
  name: "",
  url: "",
  organization_size: "2-10",
  logo_url: null,
  timezone: "UTC",
};

function FieldLabel(props: { children: ReactNode }) {
  return <p className="text-11 font-medium text-secondary">{props.children}</p>;
}

export const WorkspaceDetails = observer(function WorkspaceDetails() {
  const [isLoading, setIsLoading] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const { currentWorkspace, updateWorkspace } = useWorkspace();
  const { allowPermissions } = useUserPermissions();
  const { t } = useTranslation();

  const {
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<IWorkspace>({
    defaultValues: { ...defaultValues, ...currentWorkspace },
  });

  const workspaceLogo = watch("logo_url");
  const workspaceName = watch("name");

  const onSubmit = async (formData: IWorkspace) => {
    if (!currentWorkspace) return;

    setIsLoading(true);

    const payload: Partial<IWorkspace> = {
      name: formData.name,
      organization_size: formData.organization_size,
      timezone: formData.timezone,
    };

    try {
      await updateWorkspace(currentWorkspace.slug, payload);
      setToast({
        title: t("toast.success"),
        type: TOAST_TYPE.SUCCESS,
        message: t("workspace_settings.settings.general.toast.update_success"),
      });
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }
  };

  const handleRemoveLogo = async () => {
    if (!currentWorkspace) return;

    try {
      await updateWorkspace(currentWorkspace.slug, {
        logo_url: "",
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("workspace_settings.settings.general.toast.logo_removed"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("workspace_settings.settings.general.toast.logo_remove_error"),
      });
    }
  };

  const workspaceUrl =
    typeof window !== "undefined"
      ? `${window.location.origin.replace("http://", "").replace("https://", "")}/${currentWorkspace?.slug ?? ""}`
      : `/${currentWorkspace?.slug ?? ""}`;

  const handleCopyUrl = () => {
    if (!currentWorkspace) return;

    void copyUrlToClipboard(currentWorkspace.slug)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("toast.success"),
          message: t("workspace_settings.settings.general.toast.url_copied"),
        });
        return undefined;
      })
      .catch(() => undefined);
  };

  useEffect(() => {
    if (currentWorkspace) reset({ ...currentWorkspace });
  }, [currentWorkspace, reset]);

  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  if (!currentWorkspace) return null;

  return (
    <>
      <Controller
        control={control}
        name="logo_url"
        render={({ field: { onChange, value } }) => (
          <WorkspaceImageUploadModal
            isOpen={isImageUploadModalOpen}
            onClose={() => setIsImageUploadModalOpen(false)}
            handleRemove={handleRemoveLogo}
            onSuccess={(imageUrl) => {
              onChange(imageUrl);
              setIsImageUploadModalOpen(false);
            }}
            value={value}
          />
        )}
      />

      <div className={cn("flex w-full flex-col gap-6", { "opacity-60": !isAdmin })}>
        <WorkspaceGeneralSettingsHero workspaceName={workspaceName || currentWorkspace.name} />

        <div className="workspace-general-split-grid">
          <section className="workspace-general-identity-panel flex min-h-full flex-col overflow-hidden rounded-xl border border-subtle bg-layer-1">
            <div className="workspace-general-hero-dot-grid relative border-b border-subtle bg-gradient-to-br from-accent-subtle/20 via-transparent to-transparent px-5 py-5 lg:px-6">
              <p className="text-11 font-semibold uppercase tracking-wide text-tertiary">
                {t("workspace_settings.settings.general.sections.identity")}
              </p>

              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => isAdmin && setIsImageUploadModalOpen(true)}
                  disabled={!isAdmin}
                  className="workspace-general-identity-logo-btn self-center sm:self-start"
                  aria-label={
                    workspaceLogo && workspaceLogo !== ""
                      ? t("workspace_settings.settings.general.edit_logo")
                      : t("workspace_settings.settings.general.upload_logo")
                  }
                >
                  <span className="workspace-general-logo-frame">
                    {workspaceLogo && workspaceLogo !== "" ? (
                      <img
                        src={getFileURL(workspaceLogo)}
                        className="block max-h-full max-w-full object-contain object-center"
                        alt={t("workspace_settings.settings.general.upload_logo")}
                      />
                    ) : (
                      <span className="grid size-full place-items-center rounded-lg bg-accent-primary text-22 font-semibold text-on-color uppercase">
                        {currentWorkspace.name?.charAt(0) ?? "W"}
                      </span>
                    )}
                  </span>
                  {isAdmin && (
                    <span className="workspace-general-logo-overlay">
                      <Pencil className="size-4 text-on-color" strokeWidth={1.75} />
                      <span className="text-10 font-medium text-on-color">
                        {workspaceLogo && workspaceLogo !== ""
                          ? t("workspace_settings.settings.general.edit_logo")
                          : t("workspace_settings.settings.general.upload_logo")}
                      </span>
                    </span>
                  )}
                </button>

                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <h2 className="truncate text-16 font-semibold tracking-tight text-primary">
                    {workspaceName || currentWorkspace.name}
                  </h2>
                  <p className="mt-1 text-12 text-tertiary">
                    {t("workspace_settings.settings.general.identity_hint")}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="mt-2.5 inline-flex max-w-full items-center gap-1.5 truncate rounded-full border border-subtle bg-surface-1/90 px-2.5 py-1 font-mono text-11 text-secondary backdrop-blur-sm transition-colors hover:border-strong hover:bg-layer-1-hover hover:text-primary"
                  >
                    <Link2 className="size-3 shrink-0 opacity-60" />
                    <span className="truncate">{workspaceUrl}</span>
                    <Copy className="size-3 shrink-0 opacity-60" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-1 flex-col px-5 py-5 lg:px-6 lg:py-6">
              <div className="mb-4">
                <h3 className="text-13 font-semibold text-primary">
                  {t("workspace_settings.settings.general.sections.details")}
                </h3>
                <p className="mt-0.5 text-12 text-tertiary">
                  {t("workspace_settings.settings.general.sections.details_hint")}
                </p>
              </div>

              <div className="workspace-general-details-fields">
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>{t("workspace_settings.settings.general.name")}</FieldLabel>
                  <Controller
                    control={control}
                    name="name"
                    rules={{
                      validate: (value) => validateWorkspaceName(value, true),
                    }}
                    render={({ field: { value, onChange, ref } }) => (
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={value}
                        onChange={onChange}
                        ref={ref}
                        hasError={Boolean(errors.name)}
                        placeholder={t("workspace_settings.settings.general.name")}
                        className="h-9 w-full rounded-md text-13"
                        disabled={!isAdmin}
                      />
                    )}
                  />
                  {errors.name && <p className="text-11 text-danger-primary">{errors.name.message}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <FieldLabel>{t("workspace_settings.settings.general.company_size")}</FieldLabel>
                  <Controller
                    name="organization_size"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <CustomSelect
                        value={value}
                        onChange={onChange}
                        label={
                          ORGANIZATION_SIZE.find((c) => c === value) ??
                          t("workspace_settings.settings.general.errors.company_size.select_a_range")
                        }
                        buttonClassName="h-9 w-full border border-subtle bg-surface-1 !text-13 !shadow-none !rounded-md"
                        input
                        disabled={!isAdmin}
                      >
                        {ORGANIZATION_SIZE.map((item) => (
                          <CustomSelect.Option key={item} value={item}>
                            {item}
                          </CustomSelect.Option>
                        ))}
                      </CustomSelect>
                    )}
                  />
                </div>

                <div className="workspace-general-field-full flex flex-col gap-1.5">
                  <FieldLabel>{t("workspace_settings.settings.general.workspace_timezone")}</FieldLabel>
                  <Controller
                    name="timezone"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <TimezoneSelect
                        value={value}
                        onChange={onChange}
                        disabled={!isAdmin}
                        className="w-full max-w-md"
                        buttonClassName="h-9 w-full !text-13"
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            {isAdmin && (
              <footer className="workspace-general-details-footer">
                <Button
                  variant="primary"
                  onClick={(e) => {
                    void handleSubmit(onSubmit)(e);
                  }}
                  loading={isLoading}
                  prependIcon={<Save className="size-3.5" strokeWidth={1.75} />}
                >
                  {isLoading ? t("updating") : t("workspace_settings.settings.general.update_workspace")}
                </Button>
              </footer>
            )}
          </section>

          {isAdmin && <WorkspaceDangerZonePanel workspace={currentWorkspace} />}
        </div>
      </div>
    </>
  );
});
