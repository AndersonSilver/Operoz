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
