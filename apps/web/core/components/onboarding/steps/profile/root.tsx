import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { E_PASSWORD_STRENGTH } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { IUser } from "@operis/types";
import { EOnboardingSteps } from "@operis/types";
import { cn, getFileURL, getPasswordStrength, validatePersonName } from "@operis/utils";
// components
import { UserImageUploadModal } from "@/components/core/modals/user-image-upload-modal";
// hooks
import { useInstance } from "@/hooks/store/use-instance";
import { useUser, useUserProfile } from "@/hooks/store/user";
// services
import { AuthService } from "@/services/auth.service";
// local components
import { CommonOnboardingHeader } from "../common";
import { MarketingConsent } from "./consent";
import { SetPasswordRoot } from "./set-password";

type Props = {
  handleStepChange: (step: EOnboardingSteps, skipInvites?: boolean) => void;
};

export type TProfileSetupFormValues = {
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
  password?: string;
  confirm_password?: string;
  role?: string;
  use_case?: string[];
  has_marketing_email_consent?: boolean;
};

const authService = new AuthService();

const defaultValues: Partial<TProfileSetupFormValues> = {
  first_name: "",
  last_name: "",
  avatar_url: "",
  password: undefined,
  confirm_password: undefined,
  has_marketing_email_consent: true,
};

export const ProfileSetupStep = observer(function ProfileSetupStep({ handleStepChange }: Props) {
  const { t } = useTranslation();
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const { data: user, updateCurrentUser } = useUser();
  const { updateUserProfile } = useUserProfile();
  const { config: instanceConfig } = useInstance();
  const {
    getValues,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<TProfileSetupFormValues>({
    defaultValues: {
      ...defaultValues,
      first_name: user?.first_name,
      last_name: user?.last_name,
      avatar_url: user?.avatar_url,
    },
    mode: "onChange",
  });

  const userAvatar = watch("avatar_url");

  const handleSetPassword = async (password: string) => {
    const token = await authService.requestCSRFToken().then((data) => data?.csrf_token);
    await authService.setPassword(token, { password });
  };

  const handleSubmitUserDetail = async (formData: TProfileSetupFormValues) => {
    const userDetailsPayload: Partial<IUser> = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      avatar_url: formData.avatar_url ?? undefined,
    };
    try {
      await Promise.all([
        updateCurrentUser(userDetailsPayload),
        formData.password && handleSetPassword(formData.password),
      ]);
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("onboarding.profile.error_title"),
        message: t("onboarding.profile.error_message"),
      });
    }
  };

  const onSubmit = async (formData: TProfileSetupFormValues) => {
    if (!user) return;
    updateUserProfile({
      has_marketing_email_consent: formData.has_marketing_email_consent,
    });
    await handleSubmitUserDetail(formData);
    handleStepChange(EOnboardingSteps.PROFILE_SETUP);
  };

  const handleDelete = (url: string | null | undefined) => {
    if (!url) return;
    setValue("avatar_url", "");
  };

  const isPasswordAlreadySetup = !user?.is_password_autoset;
  const currentPassword = watch("password") || undefined;
  const currentConfirmPassword = watch("confirm_password") || undefined;

  const isValidPassword = useMemo(() => {
    if (currentPassword) {
      return (
        currentPassword === currentConfirmPassword &&
        getPasswordStrength(currentPassword) === E_PASSWORD_STRENGTH.STRENGTH_VALID
      );
    }
    return true;
  }, [currentPassword, currentConfirmPassword]);

  const isButtonDisabled =
    !isSubmitting && isValid ? (isPasswordAlreadySetup ? false : isValidPassword ? false : true) : true;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
      <CommonOnboardingHeader title={t("onboarding.profile.title")} description={t("onboarding.profile.description")} />

      <Controller
        control={control}
        name="avatar_url"
        render={({ field: { onChange, value } }) => (
          <UserImageUploadModal
            isOpen={isImageUploadModalOpen}
            onClose={() => setIsImageUploadModalOpen(false)}
            handleRemove={async () => handleDelete(getValues("avatar_url"))}
            onSuccess={(url) => {
              onChange(url);
              setIsImageUploadModalOpen(false);
            }}
            value={value && value.trim() !== "" ? value : null}
          />
        )}
      />

      <div className="flex flex-col gap-3 rounded-lg bg-layer-1/50 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4">
        <button
          className={cn(
            "mx-auto flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 sm:mx-0",
            userAvatar
              ? "border-subtle bg-surface-1"
              : "border-accent-primary/30 bg-layer-1 text-body-sm-semibold text-secondary"
          )}
          type="button"
          onClick={() => setIsImageUploadModalOpen(true)}
          aria-label={userAvatar ? t("onboarding.profile.change_image") : t("onboarding.profile.upload_image")}
        >
          {userAvatar ? (
            <img src={getFileURL(userAvatar ?? "")} alt={user?.display_name} className="size-full object-cover" />
          ) : (
            <span>{watch("first_name")?.[0]?.toUpperCase() ?? "R"}</span>
          )}
        </button>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-body-sm-semibold text-primary">{t("onboarding.profile.photo_label")}</p>
          <p className="text-13 text-tertiary">{t("onboarding.profile.photo_hint")}</p>
          <button
            className="mt-1.5 text-13 font-medium text-accent-primary transition-colors hover:text-accent-secondary"
            type="button"
            onClick={() => setIsImageUploadModalOpen(true)}
          >
            {userAvatar ? t("onboarding.profile.change_image") : t("onboarding.profile.upload_image")}
          </button>
        </div>
      </div>

      <div className="flex w-full flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label
            className="block text-13 font-medium text-tertiary after:ml-0.5 after:text-danger-primary after:content-['*']"
            htmlFor="first_name"
          >
            {t("onboarding.profile.name_label")}
          </label>
          <Controller
            control={control}
            name="first_name"
            rules={{
              required: t("onboarding.profile.name_required"),
              validate: validatePersonName,
              maxLength: {
                value: 50,
                message: t("onboarding.profile.name_max_length"),
              },
            }}
            render={({ field: { value, onChange, ref } }) => (
              <input
                ref={ref}
                id="first_name"
                name="first_name"
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                autoFocus
                className={cn(
                  "w-full rounded-md border border-strong bg-surface-1 px-3 py-2 text-secondary placeholder:text-placeholder focus:border-transparent focus:ring-2 focus:ring-accent-strong focus:outline-none",
                  { "border-danger-strong": errors.first_name }
                )}
                placeholder={t("onboarding.profile.name_placeholder")}
                autoComplete="name"
              />
            )}
          />
          {errors.first_name && <span className="text-13 text-danger-primary">{errors.first_name.message}</span>}
        </div>

        {!isPasswordAlreadySetup && (
          <SetPasswordRoot
            onPasswordChange={(password) => setValue("password", password)}
            onConfirmPasswordChange={(confirm_password) => setValue("confirm_password", confirm_password)}
          />
        )}
      </div>

      <Button variant="primary" type="submit" className="w-full" size="xl" disabled={isButtonDisabled}>
        {t("onboarding.profile.continue")}
      </Button>

      {!instanceConfig?.is_self_managed && (
        <MarketingConsent
          isChecked={!!watch("has_marketing_email_consent")}
          handleChange={(has_marketing_email_consent) =>
            setValue("has_marketing_email_consent", has_marketing_email_consent)
          }
        />
      )}
    </form>
  );
});
