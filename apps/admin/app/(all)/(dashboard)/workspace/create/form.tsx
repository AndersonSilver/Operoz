import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { LayoutGrid } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { WEB_BASE_URL, ORGANIZATION_SIZE, RESTRICTED_URLS } from "@operis/constants";
import { Button, getButtonStyling } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import { InstanceWorkspaceService } from "@operis/services";
import type { IWorkspace } from "@operis/types";
import { validateSlug, validateWorkspaceName } from "@operis/utils";
import { CustomSelect, Input } from "@operis/ui";
import {
  AdminFieldLabel,
  AdminFormActions,
  AdminFormFooter,
  AdminSettingsPanel,
} from "@/components/settings/admin-settings-panel";
import { useWorkspace } from "@/hooks/store";

const instanceWorkspaceService = new InstanceWorkspaceService();

export const WorkspaceCreateForm = observer(function WorkspaceCreateForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const [slugError, setSlugError] = useState(false);
  const [invalidSlug, setInvalidSlug] = useState(false);
  const [defaultValues, setDefaultValues] = useState<Partial<IWorkspace>>({
    name: "",
    slug: "",
    organization_size: "",
  });
  const { createWorkspace } = useWorkspace();

  const {
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors, isSubmitting, isValid },
  } = useForm<IWorkspace>({ defaultValues, mode: "onChange" });

  const workspaceBaseURL = encodeURI(WEB_BASE_URL || window.location.origin + "/");

  const handleCreateWorkspace = async (formData: IWorkspace) => {
    await instanceWorkspaceService
      .slugCheck(formData.slug)
      .then(async (res) => {
        if (res.status === true && !RESTRICTED_URLS.includes(formData.slug)) {
          setSlugError(false);
          await createWorkspace(formData)
            .then(async () => {
              setToast({
                type: TOAST_TYPE.SUCCESS,
                title: t("god_mode.common.success"),
                message: t("god_mode.pages.workspace.created_message"),
              });
              router.push(`/workspace`);
            })
            .catch(() => {
              setToast({
                type: TOAST_TYPE.ERROR,
                title: t("god_mode.common.error"),
                message: t("god_mode.pages.workspace.create_error"),
              });
            });
        } else setSlugError(true);
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("god_mode.common.error"),
          message: t("god_mode.pages.workspace.create_generic_error"),
        });
      });
  };

  useEffect(
    () => () => {
      setDefaultValues(getValues());
    },
    [getValues, setDefaultValues]
  );

  return (
    <form className="pb-2" onSubmit={handleSubmit(handleCreateWorkspace)}>
      <AdminSettingsPanel
        title={t("god_mode.pages.workspace.create_title")}
        description={t("god_mode.pages.workspace.create_description")}
        icon={LayoutGrid}
        iconClassName="text-accent-primary"
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="space-y-2">
            <AdminFieldLabel>{t("god_mode.pages.workspace.create_name_label")}</AdminFieldLabel>
            <Controller
              control={control}
              name="name"
              rules={{ validate: (value) => validateWorkspaceName(value, true) }}
              render={({ field: { value, ref, onChange } }) => (
                <Input
                  id="workspaceName"
                  type="text"
                  value={value}
                  onChange={(e) => {
                    onChange(e.target.value);
                    setValue("name", e.target.value);
                    setValue("slug", e.target.value.toLocaleLowerCase().trim().replace(/ /g, "-"), {
                      shouldValidate: true,
                    });
                  }}
                  ref={ref}
                  hasError={Boolean(errors.name)}
                  placeholder={t("god_mode.pages.workspace.create_name_placeholder")}
                  className="w-full rounded-xl"
                />
              )}
            />
            <span className="text-11 text-danger-primary">{errors?.name?.message}</span>
          </div>

          <div className="space-y-2">
            <AdminFieldLabel>{t("god_mode.pages.workspace.create_url_label")}</AdminFieldLabel>
            <div className="flex w-full items-center gap-0.5 rounded-xl border border-subtle bg-layer-2/40 px-3">
              <span className="text-13 whitespace-nowrap text-secondary">{workspaceBaseURL}</span>
              <Controller
                control={control}
                name="slug"
                rules={{ validate: (value) => validateSlug(value) }}
                render={({ field: { onChange, value, ref } }) => (
                  <Input
                    id="workspaceUrl"
                    type="text"
                    value={value.toLocaleLowerCase().trim().replace(/ /g, "-")}
                    onChange={(e) => {
                      if (/^[a-zA-Z0-9_-]+$/.test(e.target.value)) setInvalidSlug(false);
                      else setInvalidSlug(true);
                      onChange(e.target.value.toLowerCase());
                    }}
                    ref={ref}
                    hasError={Boolean(errors.slug)}
                    placeholder={t("god_mode.pages.workspace.create_url_placeholder")}
                    className="block w-full rounded-xl border-none bg-transparent !px-0 py-2 text-13"
                  />
                )}
              />
            </div>
            {slugError && (
              <p className="text-11 text-danger-primary">{t("god_mode.pages.workspace.create_url_taken")}</p>
            )}
            {invalidSlug && (
              <p className="text-11 text-danger-primary">{t("god_mode.pages.workspace.create_url_invalid")}</p>
            )}
            {errors.slug && <span className="text-11 text-danger-primary">{errors.slug.message}</span>}
          </div>

          <div className="space-y-2 lg:col-span-2 lg:max-w-lg">
            <AdminFieldLabel>{t("god_mode.pages.workspace.create_size_label")}</AdminFieldLabel>
            <Controller
              name="organization_size"
              control={control}
              rules={{ required: t("god_mode.pages.workspace.create_required") }}
              render={({ field: { value, onChange } }) => (
                <CustomSelect
                  value={value}
                  onChange={onChange}
                  label={
                    ORGANIZATION_SIZE.find((c) => c === value) ?? (
                      <span className="text-placeholder">{t("god_mode.pages.workspace.create_size_placeholder")}</span>
                    )
                  }
                  buttonClassName="!w-full !rounded-xl !border !border-subtle !bg-layer-2/50 !px-3 !py-2.5"
                  className="w-full"
                  input
                >
                  {ORGANIZATION_SIZE.map((item) => (
                    <CustomSelect.Option key={item} value={item}>
                      {item}
                    </CustomSelect.Option>
                  ))}
                </CustomSelect>
              )}
            />
            {errors.organization_size && (
              <span className="text-11 text-danger-primary">{errors.organization_size.message}</span>
            )}
          </div>
        </div>
      </AdminSettingsPanel>

      <AdminFormFooter>
        <AdminFormActions className="w-full justify-end sm:justify-between">
          <Link className={getButtonStyling("secondary", "lg")} href="/workspace">
            {t("god_mode.pages.workspace.go_back")}
          </Link>
          <Button type="submit" variant="primary" size="lg" disabled={!isValid} loading={isSubmitting}>
            {isSubmitting ? t("god_mode.pages.workspace.creating") : t("god_mode.pages.workspace.create_button")}
          </Button>
        </AdminFormActions>
      </AdminFormFooter>
    </form>
  );
});
