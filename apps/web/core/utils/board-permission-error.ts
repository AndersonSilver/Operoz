/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { TOAST_TYPE, setToast } from "@plane/propel/toast";
type TranslateFn = (key: string, params?: Record<string, string>) => string;

export const isBoardPermissionDeniedError = (error: unknown): boolean => {
  const payload = (error as { error?: string }) ?? (error as { response?: { data?: { error?: string } } })?.response?.data;
  return payload?.error === "BOARD_PERMISSION_DENIED";
};

export const showBoardPermissionDeniedToast = (error: unknown, t: TranslateFn) => {
  if (!isBoardPermissionDeniedError(error)) return false;
  const permission =
    (error as { permission?: string })?.permission ??
    (error as { response?: { data?: { permission?: string } } })?.response?.data?.permission;
  setToast({
    type: TOAST_TYPE.ERROR,
    title: t("boards.settings.permissions.denied"),
    message: permission
      ? t("boards.settings.permissions.denied_detail", { permission })
      : t("something_went_wrong"),
  });
  return true;
};
