/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { startTransition } from "react";
import { useNavigate } from "react-router";
import { ensureTrailingSlash } from "@/app/compat/next/helper";

/** Evita "component suspended while responding to synchronous input" ao navegar no hub do board. */
export function useBoardHubNavigate() {
  const navigate = useNavigate();

  return (to: string) => {
    startTransition(() => {
      navigate(ensureTrailingSlash(to));
    });
  };
}
