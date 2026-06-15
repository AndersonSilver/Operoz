import { useCallback, useEffect, useState } from "react";

export type Client360Persona = "management" | "pm";

const STORAGE_PREFIX = "client360_persona";

export function loadClient360Persona(scope: string): Client360Persona {
  if (typeof window === "undefined") return "management";
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}_${scope}`);
    return raw === "pm" ? "pm" : "management";
  } catch {
    return "management";
  }
}

export function saveClient360Persona(scope: string, persona: Client360Persona) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}_${scope}`, persona);
  } catch {
    /* ignore */
  }
}

export function useClient360Persona(scope: string) {
  const [persona, setPersonaState] = useState<Client360Persona>(() => loadClient360Persona(scope));

  useEffect(() => {
    setPersonaState(loadClient360Persona(scope));
  }, [scope]);

  const setPersona = useCallback(
    (next: Client360Persona) => {
      setPersonaState(next);
      saveClient360Persona(scope, next);
    },
    [scope]
  );

  return { persona, setPersona };
}
