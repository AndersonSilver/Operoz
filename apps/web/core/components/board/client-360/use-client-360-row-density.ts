import { useCallback, useState } from "react";
import {
  loadClient360RowDensity,
  saveClient360RowDensity,
  toggleClient360RowDensity,
  type Client360RowDensity,
} from "@/components/board/client-360/client-360-row-density";

export function useClient360RowDensity(scope: string) {
  const [density, setDensityState] = useState<Client360RowDensity>(() => loadClient360RowDensity(scope));

  const setDensity = useCallback(
    (next: Client360RowDensity) => {
      setDensityState(next);
      saveClient360RowDensity(scope, next);
    },
    [scope]
  );

  const toggleDensity = useCallback(() => {
    setDensity(toggleClient360RowDensity(density));
  }, [density, setDensity]);

  return { density, setDensity, toggleDensity };
}
