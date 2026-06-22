import { observer } from "mobx-react";
import { useForm } from "react-hook-form";
import { ImageIcon } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { IFormattedInstanceConfiguration, TInstanceImageConfigurationKeys } from "@operis/types";
import { ControllerInput } from "@/components/common/controller-input";
import { AdminFormActions, AdminFormFooter, AdminSettingsPanel } from "@/components/settings/admin-settings-panel";
import { useInstance } from "@/hooks/store";

type IInstanceImageConfigForm = {
  config: IFormattedInstanceConfiguration;
};

type ImageConfigFormValues = Record<TInstanceImageConfigurationKeys, string>;

export const InstanceImageConfigForm = observer(function InstanceImageConfigForm(props: IInstanceImageConfigForm) {
  const { config } = props;
  const { t } = useTranslation();
  const { updateInstanceConfigurations } = useInstance();

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ImageConfigFormValues>({
    defaultValues: {
      UNSPLASH_ACCESS_KEY: config["UNSPLASH_ACCESS_KEY"],
    },
  });

  const onSubmit = async (formData: ImageConfigFormValues) => {
    await updateInstanceConfigurations({ ...formData })
      .then(() =>
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("god_mode.common.success"),
          message: t("god_mode.pages.image.saved_message"),
        })
      )
      .catch((err) => console.error(err));
  };

  return (
    <form className="pb-2" onSubmit={handleSubmit(onSubmit)}>
      <AdminSettingsPanel
        chip="Unsplash"
        title={t("god_mode.pages.image.unsplash_key_label")}
        description={t("god_mode.pages.image.unsplash_key_desc")}
        icon={ImageIcon}
        iconClassName="text-accent-primary"
      >
        <ControllerInput
          control={control}
          type="password"
          name="UNSPLASH_ACCESS_KEY"
          variant="admin"
          label={t("god_mode.pages.image.unsplash_key_label")}
          description={
            <>
              {t("god_mode.pages.image.unsplash_key_desc")}{" "}
              <a
                href="https://unsplash.com/documentation#creating-a-developer-account"
                target="_blank"
                className="font-medium text-accent-primary hover:underline"
                rel="noreferrer"
              >
                {t("god_mode.pages.image.unsplash_learn_more")}
              </a>
            </>
          }
          placeholder="oXgq-sdfadsaeweqasdfasdf3234234rassd"
          error={Boolean(errors.UNSPLASH_ACCESS_KEY)}
          required
        />
      </AdminSettingsPanel>

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
