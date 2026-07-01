import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useForm } from "react-hook-form";
import { KeyRound, Server } from "lucide-react";
import { Button } from "@operoz/propel/button";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { IFormattedInstanceConfiguration, TInstanceEmailConfigurationKeys } from "@operoz/types";
import { CustomSelect } from "@operoz/ui";
import type { TControllerInputFormField } from "@/components/common/controller-input";
import { ControllerInput } from "@/components/common/controller-input";
import {
  AdminFieldLabel,
  AdminFormActions,
  AdminFormFooter,
  AdminSettingsPanel,
} from "@/components/settings/admin-settings-panel";
import { useInstance } from "@/hooks/store";
import { SendTestEmailModal } from "./test-email-modal";

type IInstanceEmailForm = {
  config: IFormattedInstanceConfiguration;
};

type EmailFormValues = Record<TInstanceEmailConfigurationKeys, string>;

type TEmailSecurityKeys = "EMAIL_USE_TLS" | "EMAIL_USE_SSL" | "NONE";

const EMAIL_SECURITY_OPTIONS: { [key in TEmailSecurityKeys]: string } = {
  EMAIL_USE_TLS: "TLS",
  EMAIL_USE_SSL: "SSL",
  NONE: "No email security",
};

export const InstanceEmailForm = observer(function InstanceEmailForm(props: IInstanceEmailForm) {
  const { config } = props;
  const [isSendTestEmailModalOpen, setIsSendTestEmailModalOpen] = useState(false);
  const { updateInstanceConfigurations } = useInstance();

  const {
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isValid, isDirty, isSubmitting },
  } = useForm<EmailFormValues>({
    defaultValues: {
      EMAIL_HOST: config["EMAIL_HOST"],
      EMAIL_PORT: config["EMAIL_PORT"],
      EMAIL_HOST_USER: config["EMAIL_HOST_USER"],
      EMAIL_HOST_PASSWORD: config["EMAIL_HOST_PASSWORD"],
      EMAIL_USE_TLS: config["EMAIL_USE_TLS"],
      EMAIL_USE_SSL: config["EMAIL_USE_SSL"],
      EMAIL_FROM: config["EMAIL_FROM"],
      ENABLE_SMTP: config["ENABLE_SMTP"],
    },
  });

  const emailFormFields: TControllerInputFormField[] = [
    {
      key: "EMAIL_HOST",
      type: "text",
      label: "Host",
      placeholder: "email.google.com",
      error: Boolean(errors.EMAIL_HOST),
      required: true,
    },
    {
      key: "EMAIL_PORT",
      type: "text",
      label: "Port",
      placeholder: "8080",
      error: Boolean(errors.EMAIL_PORT),
      required: true,
    },
    {
      key: "EMAIL_FROM",
      type: "text",
      label: "Sender's email address",
      description:
        "This is the email address your users will see when getting emails from this instance. You will need to verify this address.",
      placeholder: "no-reply@operoz.app",
      error: Boolean(errors.EMAIL_FROM),
      required: true,
    },
  ];

  const optionalEmailFormFields: TControllerInputFormField[] = [
    {
      key: "EMAIL_HOST_USER",
      type: "text",
      label: "Username",
      placeholder: "smtp-user@operoz.app",
      error: Boolean(errors.EMAIL_HOST_USER),
      required: false,
    },
    {
      key: "EMAIL_HOST_PASSWORD",
      type: "password",
      label: "Password",
      placeholder: "Password",
      error: Boolean(errors.EMAIL_HOST_PASSWORD),
      required: false,
    },
  ];

  const onSubmit = async (formData: EmailFormValues) => {
    await updateInstanceConfigurations({ ...formData, ENABLE_SMTP: "1" })
      .then(() =>
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success",
          message: "Email Settings updated successfully",
        })
      )
      .catch((err) => console.error(err));
  };

  const useTLSValue = watch("EMAIL_USE_TLS");
  const useSSLValue = watch("EMAIL_USE_SSL");
  const emailSecurityKey: TEmailSecurityKeys = useMemo(() => {
    if (useTLSValue === "1") return "EMAIL_USE_TLS";
    if (useSSLValue === "1") return "EMAIL_USE_SSL";
    return "NONE";
  }, [useTLSValue, useSSLValue]);

  const handleEmailSecurityChange = (key: TEmailSecurityKeys) => {
    if (key === "EMAIL_USE_SSL") {
      setValue("EMAIL_USE_TLS", "0");
      setValue("EMAIL_USE_SSL", "1");
    }
    if (key === "EMAIL_USE_TLS") {
      setValue("EMAIL_USE_TLS", "1");
      setValue("EMAIL_USE_SSL", "0");
    }
    if (key === "NONE") {
      setValue("EMAIL_USE_TLS", "0");
      setValue("EMAIL_USE_SSL", "0");
    }
  };

  return (
    <form className="space-y-5 pb-2" onSubmit={handleSubmit(onSubmit)}>
      <SendTestEmailModal isOpen={isSendTestEmailModalOpen} handleClose={() => setIsSendTestEmailModalOpen(false)} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <AdminSettingsPanel
          chip="SMTP"
          title="Server connection"
          description="Host, port, and sender address for outbound email."
          icon={Server}
          iconClassName="text-accent-primary"
          fillHeight
        >
          <div className="grid grid-cols-1 gap-4">
            {emailFormFields.map((field) => (
              <ControllerInput
                key={field.key}
                control={control}
                type={field.type}
                name={field.key}
                variant="admin"
                label={field.label}
                description={field.description}
                placeholder={field.placeholder}
                error={field.error}
                required={field.required}
              />
            ))}
            <div className="space-y-2">
              <AdminFieldLabel>Email security</AdminFieldLabel>
              <CustomSelect
                value={emailSecurityKey}
                label={EMAIL_SECURITY_OPTIONS[emailSecurityKey]}
                onChange={handleEmailSecurityChange}
                buttonClassName="!w-full !rounded-xl !border !border-subtle !bg-layer-2/50 !px-3 !py-2.5"
                className="w-full"
                input
              >
                {Object.entries(EMAIL_SECURITY_OPTIONS).map(([key, value]) => (
                  <CustomSelect.Option key={key} value={key} className="w-full">
                    {value}
                  </CustomSelect.Option>
                ))}
              </CustomSelect>
            </div>
          </div>
        </AdminSettingsPanel>

        <AdminSettingsPanel
          chip="Optional"
          title="Authentication"
          description="Username and password for your SMTP server, if required."
          icon={KeyRound}
          iconClassName="text-tertiary"
          accentClassName="bg-tertiary"
          fillHeight
        >
          <div className="grid grid-cols-1 gap-4">
            {optionalEmailFormFields.map((field) => (
              <ControllerInput
                key={field.key}
                control={control}
                type={field.type}
                name={field.key}
                variant="admin"
                label={field.label}
                description={field.description}
                placeholder={field.placeholder}
                error={field.error}
                required={field.required}
              />
            ))}
          </div>
        </AdminSettingsPanel>
      </div>

      <AdminFormFooter>
        <AdminFormActions className="w-full justify-end sm:justify-between">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => setIsSendTestEmailModalOpen(true)}
            disabled={!isValid}
          >
            Send test email
          </Button>
          <Button type="submit" variant="primary" size="lg" loading={isSubmitting} disabled={!isValid || !isDirty}>
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
        </AdminFormActions>
      </AdminFormFooter>
    </form>
  );
});
