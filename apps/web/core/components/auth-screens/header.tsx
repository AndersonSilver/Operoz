import React from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { AUTH_TRACKER_ELEMENTS } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { PlaneLockup } from "@operis/propel/icons";
import { cn } from "@operis/utils";
import { PageHead } from "@/components/core/page-title";
import { EAuthModes } from "@/helpers/authentication.helper";
import { useInstance } from "@/hooks/store/use-instance";

const authContentMap = {
  [EAuthModes.SIGN_IN]: {
    pageTitle: "Entrar",
    text: "auth.common.new_to_plane",
    linkText: "Sign up",
    linkHref: "/sign-up",
  },
  [EAuthModes.SIGN_UP]: {
    pageTitle: "Criar conta",
    text: "auth.common.already_have_an_account",
    linkText: "Sign in",
    linkHref: "/sign-in",
  },
};

type AuthHeaderProps = {
  type: EAuthModes;
  compactOnDesktop?: boolean;
};

export const AuthHeader = observer(function AuthHeader({ type, compactOnDesktop = false }: AuthHeaderProps) {
  const { t } = useTranslation();
  // store
  const { config } = useInstance();
  // derived values
  const enableSignUpConfig = config?.enable_signup ?? false;

  // Por agora: sem link "Inscrever-se" / "New to Plane? Sign up" no sign-in (fork interno).
  const additionalAction =
    type === EAuthModes.SIGN_UP && enableSignUpConfig ? (
      <div className="flex flex-col items-end text-center text-13 font-medium text-tertiary sm:flex-row sm:items-center sm:gap-2">
        <span className="text-body-sm-regular text-tertiary">{t(authContentMap[type].text)}</span>
        <Link
          data-ph-element={AUTH_TRACKER_ELEMENTS.NAVIGATE_TO_SIGN_UP}
          href={authContentMap[type].linkHref}
          className="text-body-sm-semibold text-accent-primary hover:underline"
        >
          {t(authContentMap[type].linkText)}
        </Link>
      </div>
    ) : undefined;

  return (
    <AuthHeaderBase
      pageTitle={t(authContentMap[type].pageTitle)}
      additionalAction={additionalAction}
      compactOnDesktop={compactOnDesktop}
    />
  );
});

type TAuthHeaderBase = {
  pageTitle: string;
  additionalAction?: React.ReactNode;
  compactOnDesktop?: boolean;
};

export function AuthHeaderBase(props: TAuthHeaderBase) {
  const { pageTitle, additionalAction, compactOnDesktop = false } = props;
  return (
    <>
      <PageHead title="Operoz" />
      <div
        className={cn(
          "flex w-full flex-shrink-0 items-center justify-between gap-6 pt-0 pb-2 sm:pb-3",
          compactOnDesktop && "lg:min-h-8 lg:pb-6"
        )}
      >
        <Link
          href="/"
          className={cn(
            "focus-visible:ring-accent-primary focus-visible:ring-offset-surface-1 rounded-lg transition-opacity outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2",
            compactOnDesktop && "lg:hidden"
          )}
        >
          <PlaneLockup height={44} className="w-auto max-w-[min(88vw,300px)] sm:max-w-[340px]" />
        </Link>
        <div className="ml-auto flex items-center gap-3">{additionalAction}</div>
      </div>
    </>
  );
}
