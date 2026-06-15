import { useCallback, useEffect, useMemo, useState } from "react";
import {
  defaultClient360TableColumns,
  isDefaultClient360TableColumns,
  loadClient360TableColumns,
  moveClient360TableColumn,
  normalizeClient360TableColumns,
  saveClient360TableColumns,
  toggleClient360TableColumn,
  visibleClient360TableColumns,
  type Client360TableColumnConfig,
  type Client360TableColumnId,
} from "@/components/board/client-360/client-360-table-columns";

export function useClient360TableColumns(scope: string, includeBoard: boolean) {
  const [columns, setColumnsState] = useState<Client360TableColumnConfig[]>(() =>
    loadClient360TableColumns(scope, includeBoard)
  );

  useEffect(() => {
    setColumnsState(loadClient360TableColumns(scope, includeBoard));
  }, [scope, includeBoard]);

  const persist = useCallback(
    (next: Client360TableColumnConfig[]) => {
      setColumnsState(next);
      saveClient360TableColumns(scope, next);
    },
    [scope]
  );

  const toggleColumn = useCallback(
    (columnId: Client360TableColumnId) => {
      persist(toggleClient360TableColumn(columns, columnId));
    },
    [columns, persist]
  );

  const moveColumn = useCallback(
    (columnId: Client360TableColumnId, direction: "up" | "down") => {
      persist(moveClient360TableColumn(columns, columnId, direction));
    },
    [columns, persist]
  );

  const resetColumns = useCallback(() => {
    persist(defaultClient360TableColumns(includeBoard));
  }, [includeBoard, persist]);

  const applyColumns = useCallback(
    (next: Client360TableColumnConfig[], includeBoardOverride?: boolean) => {
      persist(normalizeClient360TableColumns(next, includeBoardOverride ?? includeBoard));
    },
    [includeBoard, persist]
  );

  const visibleColumns = useMemo(() => visibleClient360TableColumns(columns), [columns]);
  const hasCustomColumns = useMemo(
    () => !isDefaultClient360TableColumns(columns, includeBoard),
    [columns, includeBoard]
  );

  return {
    columns,
    visibleColumns,
    hasCustomColumns,
    toggleColumn,
    moveColumn,
    resetColumns,
    applyColumns,
  };
}
