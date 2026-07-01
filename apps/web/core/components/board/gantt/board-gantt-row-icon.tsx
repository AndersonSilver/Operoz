/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { Logo } from "@plane/propel/emoji-icon-picker";
import type { TLogoProps } from "@plane/types";
import { cn } from "@plane/utils";

type Props = {
  logo?: TLogoProps | null;
  fallback?: ReactNode;
  size?: number;
  className?: string;
};

export function hasConfiguredLogo(logo?: TLogoProps | null): boolean {
  if (!logo || !logo.in_use) return false;
  const key = logo.in_use;
  const value = logo[key as keyof TLogoProps];
  if (value == null) return false;
  if (typeof value === "object" && value !== null && "value" in value) {
    return Boolean((value as { value?: string }).value);
  }
  return Boolean(value);
}

export function BoardGanttRowIcon(props: Props) {
  const { logo, fallback, size = 16, className } = props;

  if (hasConfiguredLogo(logo)) {
    return (
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded border border-subtle/60 bg-layer-2",
          className
        )}
        style={{ width: size + 8, height: size + 8 }}
      >
        <Logo logo={logo!} size={size} />
      </span>
    );
  }

  if (fallback) return <span className={cn("shrink-0", className)}>{fallback}</span>;
  return null;
}
