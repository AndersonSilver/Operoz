/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { AuthRoot } from "@/components/account/auth-forms/auth-root";
import type { EAuthModes } from "@/helpers/authentication.helper";
import { AuthFooter } from "./footer";
import { AuthHeader } from "./header";

type AuthBaseProps = {
  authType: EAuthModes;
};

export function AuthBase({ authType }: AuthBaseProps) {
  return (
    <div className="relative isolate flex min-h-screen w-full flex-col overflow-x-hidden overflow-y-auto bg-surface-1">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-28 left-1/2 h-[min(55vh,440px)] w-[min(96vw,680px)] -translate-x-1/2 rounded-full bg-accent-primary/[0.14] blur-[72px] dark:bg-accent-primary/[0.18]" />
        <div className="absolute -right-16 bottom-0 h-[min(40vh,320px)] w-[min(85vw,480px)] rounded-full bg-accent-primary/[0.07] blur-[56px]" />
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-[110rem] flex-1 flex-col px-5 pt-7 pb-12 sm:px-10 sm:pt-10">
        <AuthHeader type={authType} />
        <AuthRoot authMode={authType} />
        <AuthFooter />
      </div>
    </div>
  );
}
