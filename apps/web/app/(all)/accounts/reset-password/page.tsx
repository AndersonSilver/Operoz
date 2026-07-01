// plane imports
import { EAuthModes } from "@operoz/constants";
// components
import { ResetPasswordForm } from "@/components/account/auth-forms/reset-password";
import { AuthHeader } from "@/components/auth-screens/header";
import { AuthThemeToggle } from "@/components/auth-screens/theme-toggle";
// helpers
import { EPageTypes } from "@/helpers/authentication.helper";
// layouts
import DefaultLayout from "@/layouts/default-layout";
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";

function ResetPasswordPage() {
  return (
    <DefaultLayout>
      <AuthenticationWrapper pageType={EPageTypes.NON_AUTHENTICATED}>
        <div className="relative z-10 flex h-screen w-screen flex-col items-center overflow-hidden overflow-y-auto px-8 pt-6 pb-10">
          <AuthThemeToggle />
          <AuthHeader type={EAuthModes.SIGN_IN} />
          <ResetPasswordForm />
        </div>
      </AuthenticationWrapper>
    </DefaultLayout>
  );
}

export default ResetPasswordPage;
