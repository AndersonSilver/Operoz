/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { AUTH_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { PlaneLockup } from "@plane/propel/icons";
import { PageHead } from "@/components/core/page-title";
import { EAuthModes } from "@/helpers/authentication.helper";
import { useInstance } from "@/hooks/store/use-instance";

const authContentMap = {
  [EAuthModes.SIGN_IN]: {
    pageTitle: "Sign up",
    text: "auth.common.new_to_plane",
    linkText: "Sign up",
    linkHref: "/sign-up",
  },
  [EAuthModes.SIGN_UP]: {
    pageTitle: "Sign in",
    text: "auth.common.already_have_an_account",
    linkText: "Sign in",
    linkHref: "/sign-in",
  },
};

type AuthHeaderProps = {
  type: EAuthModes;
};

export const AuthHeader = observer(function AuthHeader({ type }: AuthHeaderProps) {
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
    <AuthHeaderBase pageTitle={t(authContentMap[type].pageTitle)} additionalAction={additionalAction} />
  );
});

type TAuthHeaderBase = {
  pageTitle: string;
  additionalAction?: React.ReactNode;
};

export function AuthHeaderBase(props: TAuthHeaderBase) {
  const { pageTitle, additionalAction } = props;
  return (
    <>
      <PageHead title={pageTitle + " - Plane"} />
      <div className="flex w-full flex-shrink-0 items-center justify-between gap-6 pb-2 pt-0 sm:pb-3">
        <Link href="/" className="rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1">
          <PlaneLockup className="h-10 w-auto max-w-[min(88vw,300px)] sm:h-11 sm:max-w-[340px]" />
        </Link>
        {additionalAction}
      </div>
    </>
  );
}
