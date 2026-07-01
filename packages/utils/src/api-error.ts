/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/** True when an Axios/fetch request was aborted (e.g. superseded by a newer issues fetch). */
export const isAxiosCancelError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;

  const err = error as { code?: string; name?: string; message?: string };

  return (
    err.code === "ERR_CANCELED" ||
    err.name === "CanceledError" ||
    err.name === "AbortError" ||
    (typeof err.message === "string" && /abort|canceled|cancelled/i.test(err.message))
  );
};
