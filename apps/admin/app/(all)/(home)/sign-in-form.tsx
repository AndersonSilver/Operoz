import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
// plane internal packages
import type { EAdminAuthErrorCodes, TAdminAuthErrorInfo } from "@operoz/constants";
import { API_BASE_URL } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { AuthService } from "@operoz/services";
import { Input, Spinner } from "@operoz/ui";
// components
import { Banner } from "@/components/common/banner";
// local components
import { FormHeader } from "@/components/instance/form-header";
import { AuthBanner } from "./auth-banner";
import { AuthCard } from "./auth-card";
import { authErrorHandler } from "./auth-helpers";

const authService = new AuthService();

enum EErrorCodes {
  INSTANCE_NOT_CONFIGURED = "INSTANCE_NOT_CONFIGURED",
  REQUIRED_EMAIL_PASSWORD = "REQUIRED_EMAIL_PASSWORD",
  INVALID_EMAIL = "INVALID_EMAIL",
  USER_DOES_NOT_EXIST = "USER_DOES_NOT_EXIST",
  AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED",
}

type TError = {
  type: EErrorCodes | undefined;
  message: string | undefined;
};

type TFormData = {
  email: string;
  password: string;
};

const defaultFromData: TFormData = {
  email: "",
  password: "",
};

export function InstanceSignInForm() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || undefined;
  const errorCode = searchParams.get("error_code") || undefined;
  const errorMessage = searchParams.get("error_message") || undefined;

  const [showPassword, setShowPassword] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | undefined>(undefined);
  const [formData, setFormData] = useState<TFormData>(defaultFromData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorInfo, setErrorInfo] = useState<TAdminAuthErrorInfo | undefined>(undefined);

  const handleFormChange = (key: keyof TFormData, value: string | boolean) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (csrfToken === undefined)
      void authService
        .requestCSRFToken()
        .then((data) => data?.csrf_token && setCsrfToken(data.csrf_token))
        .catch(() => undefined);
  }, [csrfToken]);

  useEffect(() => {
    if (emailParam) setFormData((prev) => ({ ...prev, email: emailParam }));
  }, [emailParam]);

  const errorData: TError = useMemo(() => {
    if (errorCode && errorMessage) {
      switch (errorCode) {
        case EErrorCodes.INSTANCE_NOT_CONFIGURED:
          return { type: EErrorCodes.INSTANCE_NOT_CONFIGURED, message: errorMessage };
        case EErrorCodes.REQUIRED_EMAIL_PASSWORD:
          return { type: EErrorCodes.REQUIRED_EMAIL_PASSWORD, message: errorMessage };
        case EErrorCodes.INVALID_EMAIL:
          return { type: EErrorCodes.INVALID_EMAIL, message: errorMessage };
        case EErrorCodes.USER_DOES_NOT_EXIST:
          return { type: EErrorCodes.USER_DOES_NOT_EXIST, message: errorMessage };
        case EErrorCodes.AUTHENTICATION_FAILED:
          return { type: EErrorCodes.AUTHENTICATION_FAILED, message: errorMessage };
        default:
          return { type: undefined, message: undefined };
      }
    }
    return { type: undefined, message: undefined };
  }, [errorCode, errorMessage]);

  const canSubmit = Boolean(formData.email.trim() && formData.password && !isSubmitting);

  useEffect(() => {
    if (errorCode) {
      const errorDetail = authErrorHandler(errorCode?.toString() as EAdminAuthErrorCodes);
      if (errorDetail) setErrorInfo(errorDetail);
    }
  }, [errorCode]);

  return (
    <AuthCard>
      <div className="space-y-1">
        <p className="text-12 font-semibold tracking-[0.16em] text-accent-primary uppercase lg:hidden">
          {t("god_mode.brand.instance_admin")}
        </p>
        <FormHeader heading={t("god_mode.auth.sign_in.title")} subHeading={t("god_mode.auth.sign_in.subtitle")} />
      </div>

      <form
        className="space-y-5"
        method="POST"
        action={`${API_BASE_URL}/api/instances/admins/sign-in/`}
        onSubmit={() => setIsSubmitting(true)}
        onError={() => setIsSubmitting(false)}
      >
        {errorData.type && errorData?.message ? (
          <Banner type="error" message={errorData?.message} />
        ) : (
          errorInfo && <AuthBanner bannerData={errorInfo} handleBannerData={(value) => setErrorInfo(value)} />
        )}
        <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />

        <div className="w-full space-y-1.5">
          <label className="text-13 font-medium text-secondary" htmlFor="email">
            {t("god_mode.auth.sign_in.email_label")} <span className="text-danger-primary">*</span>
          </label>
          <Input
            className="h-10 w-full border border-subtle !bg-surface-1 placeholder:text-placeholder"
            id="email"
            name="email"
            type="email"
            inputSize="md"
            placeholder={t("god_mode.auth.sign_in.email_placeholder")}
            value={formData.email}
            onChange={(e) => handleFormChange("email", e.target.value)}
            autoComplete="email"
            autoFocus
          />
        </div>

        <div className="w-full space-y-1.5">
          <label className="text-13 font-medium text-secondary" htmlFor="password">
            {t("god_mode.auth.sign_in.password_label")} <span className="text-danger-primary">*</span>
          </label>
          <div className="relative">
            <Input
              className="h-10 w-full border border-subtle !bg-surface-1 pr-10 placeholder:text-placeholder"
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              inputSize="md"
              placeholder={t("god_mode.auth.sign_in.password_placeholder")}
              value={formData.password}
              onChange={(e) => handleFormChange("password", e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center justify-center rounded-sm p-0.5 text-tertiary transition-colors hover:text-primary"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={
                showPassword ? t("god_mode.auth.sign_in.hide_password") : t("god_mode.auth.sign_in.show_password")
              }
            >
              {showPassword ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="xl"
          className="h-10 w-full text-body-sm-medium"
          disabled={!canSubmit}
        >
          {isSubmitting ? <Spinner height="20px" width="20px" /> : t("god_mode.auth.sign_in.submit")}
        </Button>
      </form>
    </AuthCard>
  );
}
