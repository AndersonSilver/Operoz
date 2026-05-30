/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Loader2 } from "lucide-react";

export function LogoSpinner() {
  return (
    <div className="flex items-center justify-center" role="status" aria-live="polite">
      <Loader2 className="size-7 shrink-0 animate-spin text-accent-primary sm:size-10" strokeWidth={2.25} aria-hidden />
      <span className="sr-only">Loading</span>
    </div>
  );
}
