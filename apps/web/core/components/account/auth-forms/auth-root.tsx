import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
// plane imports
import { OAuthOptions } from "@operoz/ui";
// helpers
import type { TAuthErrorInfo } from "@/helpers/authentication.helper";
import {
  EAuthModes,
  EAuthSteps,
  EAuthenticationErrorCodes,
  EErrorAlertType,
  authErrorHandler,
} from "@/helpers/authentication.helper";
// hooks
import { useOAuthConfig } from "@/hooks/oauth";
import { useInstance } from "@/hooks/store/use-instance";
// local imports
import { AuthBanner } from "./auth-banner";
import { AuthHeader, AuthHeaderBase } from "./auth-header";
import { AuthFormRoot } from "./form-root";

type TAuthRoot = {
  authMode: EAuthModes;
};

export const AuthRoot = observer(function AuthRoot(props: TAuthRoot) {
  //router
  const searchParams = useSearchParams();
  // query params
  const emailParam = searchParams.get("email");
  const invitation_id = searchParams.get("invitation_id");
  const workspaceSlug = searchParams.get("slug");
  const error_code = searchParams.get("error_code");
  // props
  const { authMode: currentAuthMode } = props;
  // states
  const [authMode, setAuthMode] = useState<EAuthModes | undefined>(undefined);
  const [authStep, setAuthStep] = useState<EAuthSteps>(EAuthSteps.EMAIL);
  const [email, setEmail] = useState(emailParam ? emailParam.toString() : "");
  const [errorInfo, setErrorInfo] = useState<TAuthErrorInfo | undefined>(undefined);
  // store hooks
  const { config } = useInstance();
  // derived values
  const oAuthActionText = authMode === EAuthModes.SIGN_UP ? "Sign up" : "Sign in";
  const { isOAuthEnabled, oAuthOptions } = useOAuthConfig(oAuthActionText);
  const isEmailBasedAuthEnabled = config?.is_email_password_enabled || config?.is_magic_login_enabled;
  const noAuthMethodsAvailable = !isOAuthEnabled && !isEmailBasedAuthEnabled;

  useEffect(() => {
    if (!authMode && currentAuthMode) setAuthMode(currentAuthMode);
  }, [currentAuthMode, authMode]);

  useEffect(() => {
    if (error_code && authMode) {
      const errorhandler = authErrorHandler(error_code?.toString() as EAuthenticationErrorCodes);
      if (errorhandler) {
        // password error handler
        if ([EAuthenticationErrorCodes.AUTHENTICATION_FAILED_SIGN_UP].includes(errorhandler.code)) {
          setAuthMode(EAuthModes.SIGN_UP);
          setAuthStep(EAuthSteps.PASSWORD);
        }
        if ([EAuthenticationErrorCodes.AUTHENTICATION_FAILED_SIGN_IN].includes(errorhandler.code)) {
          setAuthMode(EAuthModes.SIGN_IN);
          setAuthStep(EAuthSteps.PASSWORD);
        }
        // magic_code error handler
        if (
          [
            EAuthenticationErrorCodes.INVALID_MAGIC_CODE_SIGN_UP,
            EAuthenticationErrorCodes.INVALID_EMAIL_MAGIC_SIGN_UP,
            EAuthenticationErrorCodes.EXPIRED_MAGIC_CODE_SIGN_UP,
            EAuthenticationErrorCodes.EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_UP,
          ].includes(errorhandler.code)
        ) {
          setAuthMode(EAuthModes.SIGN_UP);
          setAuthStep(EAuthSteps.UNIQUE_CODE);
        }
        if (
          [
            EAuthenticationErrorCodes.INVALID_MAGIC_CODE_SIGN_IN,
            EAuthenticationErrorCodes.INVALID_EMAIL_MAGIC_SIGN_IN,
            EAuthenticationErrorCodes.EXPIRED_MAGIC_CODE_SIGN_IN,
            EAuthenticationErrorCodes.EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_IN,
          ].includes(errorhandler.code)
        ) {
          setAuthMode(EAuthModes.SIGN_IN);
          setAuthStep(EAuthSteps.UNIQUE_CODE);
        }

        setErrorInfo(errorhandler);
      }
    }
  }, [error_code, authMode]);

  if (!authMode) return <></>;

  if (noAuthMethodsAvailable) {
    return (
      <AuthContainer>
        <AuthHeaderBase
          header="No authentication methods available"
          subHeader="Please contact your administrator to enable authentication for your instance."
        />
      </AuthContainer>
    );
  }

  return (
    <AuthContainer>
      {errorInfo && errorInfo?.type === EErrorAlertType.BANNER_ALERT && (
        <AuthBanner message={errorInfo.message} handleBannerData={(value) => setErrorInfo(value)} />
      )}
      <AuthHeader
        workspaceSlug={workspaceSlug?.toString() || undefined}
        invitationId={invitation_id?.toString() || undefined}
        invitationEmail={email || undefined}
        authMode={authMode}
        currentAuthStep={authStep}
      />
      {isOAuthEnabled && (
        <OAuthOptions
          options={oAuthOptions}
          compact={authStep === EAuthSteps.PASSWORD}
          showDivider={isEmailBasedAuthEnabled}
          className="gap-3"
        />
      )}
      {isEmailBasedAuthEnabled && (
        <AuthFormRoot
          authStep={authStep}
          authMode={authMode}
          email={email}
          setEmail={(email) => setEmail(email)}
          setAuthMode={(authMode) => setAuthMode(authMode)}
          setAuthStep={(authStep) => setAuthStep(authStep)}
          setErrorInfo={(errorInfo) => setErrorInfo(errorInfo)}
          currentAuthMode={currentAuthMode}
        />
      )}
    </AuthContainer>
  );
});

function AuthContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-grow flex-col items-center justify-center lg:mt-0 lg:justify-center">
      <div className="group relative w-full">
        <div
          className="pointer-events-none absolute -inset-3 rounded-[1.75rem] bg-accent-primary/15 opacity-0 blur-2xl transition-opacity duration-500 group-focus-within:opacity-100 dark:bg-accent-primary/20"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -inset-px rounded-[1.35rem] bg-gradient-to-br from-accent-primary/25 via-white/[0.06] to-accent-primary/10 dark:from-accent-primary/35 dark:via-white/[0.04]"
          aria-hidden="true"
        />
        <div className="relative overflow-hidden rounded-[1.35rem] border border-white/[0.09] bg-layer-2/70 p-8 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-10 dark:border-white/[0.06] dark:bg-[#12141a]/75 dark:shadow-[0_40px_100px_-40px_rgba(0,0,0,0.85)]">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-accent-primary/[0.03]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10"
            aria-hidden="true"
          />
          <div className="relative flex w-full flex-col gap-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
