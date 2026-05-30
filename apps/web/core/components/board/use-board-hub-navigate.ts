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
