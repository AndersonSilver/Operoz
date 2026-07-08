import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { Cog, Telescope } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { IInstance, IInstanceAdmin } from "@operoz/types";
import { ControllerInput } from "@/components/common/controller-input";
import {
  AdminConfigSection,
  AdminFormActions,
  AdminFormFooter,
  AdminReadOnlyField,
  AdminSettingsPanel,
  AdminToggleCard,
} from "@/components/settings/admin-settings-panel";
import { useInstance } from "@/hooks/store";

export interface IGeneralConfigurationForm {
  instance: IInstance;
  instanceAdmins: IInstanceAdmin[];
}

export const GeneralConfigurationForm = observer(function GeneralConfigurationForm(props: IGeneralConfigurationForm) {
  const { instance, instanceAdmins } = props;
  const { t } = useTranslation();
  const { updateInstanceInfo } = useInstance();

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Partial<IInstance>>({
    defaultValues: {
      instance_name: instance?.instance_name,
      is_telemetry_enabled: instance?.is_telemetry_enabled,
    },
  });

  const onSubmit = async (formData: Partial<IInstance>) => {
    await updateInstanceInfo({ ...formData })
      .then(() =>
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("god_mode.common.success"),
          message: t("god_mode.pages.general.settings_updated"),
        })
      )
      .catch((err) => console.error(err));
  };

  return (
    <form className="space-y-5 pb-2" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <AdminSettingsPanel
          title={t("god_mode.pages.general.instance_details")}
          description={t("god_mode.pages.general.description")}
          icon={Cog}
          iconClassName="text-accent-primary"
          fillHeight
        >
          <AdminConfigSection title={t("god_mode.pages.general.instance_details")}>
            <div className="grid grid-cols-1 gap-4">
              <ControllerInput
                key="instance_name"
                name="instance_name"
                control={control}
                type="text"
                variant="admin"
                label={t("god_mode.pages.general.instance_name_label")}
                placeholder={t("god_mode.pages.general.instance_name_placeholder")}
                error={Boolean(errors.instance_name)}
                required
              />
              <AdminReadOnlyField
                label={t("god_mode.pages.general.email_label")}
                value={instanceAdmins[0]?.user_detail?.email ?? ""}
              />
              <AdminReadOnlyField
                label={t("god_mode.pages.general.instance_id_label")}
                value={instance.instance_id ?? ""}
                mono
              />
            </div>
          </AdminConfigSection>
        </AdminSettingsPanel>

        <AdminSettingsPanel
          title={t("god_mode.pages.general.telemetry_title")}
          description={t("god_mode.pages.general.telemetry_desc")}
          icon={Telescope}
          iconClassName="text-tertiary"
          accentClassName="bg-tertiary"
          fillHeight
          glowActive={Boolean(instance?.is_telemetry_enabled)}
        >
          <Controller
            control={control}
            name="is_telemetry_enabled"
            render={({ field: { value, onChange } }) => (
              <AdminToggleCard
                label={t("god_mode.pages.general.telemetry_toggle")}
                description={t("god_mode.pages.general.telemetry_policy")}
                value={value ?? false}
                onChange={onChange}
                disabled={isSubmitting}
              />
            )}
          />
        </AdminSettingsPanel>
      </div>

      <AdminFormFooter>
        <AdminFormActions className="w-full justify-end">
          <Button type="submit" variant="primary" size="lg" loading={isSubmitting}>
            {isSubmitting ? t("god_mode.common.saving") : t("god_mode.common.save")}
          </Button>
        </AdminFormActions>
      </AdminFormFooter>
    </form>
  );
});
