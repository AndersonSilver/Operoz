import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "@operis/hooks";
import type { IIssueDisplayProperties } from "@operis/types";
import {
  buildListLayoutGridTemplateColumns,
  buildListPropertyColumns,
  buildListPropertyGridTemplateColumns,
  clampListColumnWidthPx,
  computeListPropertiesPanelWidthPx,
  getDefaultListGridColumnWidths,
  LIST_GRID_TITLE_COLUMN_META,
  type TListGridResizableColumn,
  type TListPropertyColumn,
} from "../properties/list-property-columns";

export const LIST_GRID_ROW_GAP = "0.75rem";

export type TListGridStoredWidths = {
  title?: number;
  columns?: Partial<Record<TListPropertyColumn, number>>;
};

type TListGridColumnsContextValue = {
  columns: TListPropertyColumn[];
  /** Grelha das colunas de propriedades (Estado, Prioridade, …). */
  propertyGridTemplateColumns: string;
  propertiesPanelWidthPx: number;
  /** Grelha da linha: título | painel propriedades | ações */
  layoutGridTemplateColumns: string;
  titleWidthPx: number;
  columnWidthsPx: Record<TListPropertyColumn, number>;
  resizeColumn: (column: TListGridResizableColumn, widthPx: number) => void;
  resizeColumnByDelta: (column: TListGridResizableColumn, deltaPx: number) => void;
};

const ListGridColumnsContext = createContext<TListGridColumnsContextValue | null>(null);

type ProviderProps = {
  children: ReactNode;
  displayProperties: IIssueDisplayProperties;
  isEpic?: boolean;
  crossProject?: boolean;
  showModules: boolean;
  showCycles: boolean;
  showEstimate: boolean;
  /** Chave localStorage; omitir para não persistir */
  storageKey?: string;
};

export function ListGridColumnsProvider(props: ProviderProps) {
  const {
    children,
    displayProperties,
    isEpic = false,
    crossProject = false,
    showModules,
    showCycles,
    showEstimate,
    storageKey,
  } = props;

  const { storedValue, setValue } = useLocalStorage<TListGridStoredWidths | undefined>(
    storageKey ?? "list-grid-columns-disabled",
    undefined
  );

  const columns = useMemo(
    () =>
      buildListPropertyColumns({
        displayProperties,
        isEpic,
        showModules,
        showCycles,
        showEstimate,
        crossProject,
      }),
    [displayProperties, isEpic, showModules, showCycles, showEstimate, crossProject]
  );

  const [titleWidthPx, setTitleWidthPx] = useState(
    () => storedValue?.title ?? LIST_GRID_TITLE_COLUMN_META.defaultWidthPx
  );

  const [columnWidthsPx, setColumnWidthsPx] = useState<Record<TListPropertyColumn, number>>(() => ({
    ...getDefaultListGridColumnWidths(columns),
    ...storedValue?.columns,
  }));

  useEffect(() => {
    setColumnWidthsPx((prev) => {
      const next = { ...getDefaultListGridColumnWidths(columns), ...storedValue?.columns };
      const sameKeys =
        Object.keys(prev).length === Object.keys(next).length &&
        columns.every((col) => prev[col] === next[col]);
      return sameKeys ? prev : next;
    });
  }, [columns, storedValue?.columns]);

  useEffect(() => {
    if (storedValue?.title) setTitleWidthPx(storedValue.title);
  }, [storedValue?.title]);

  const persistWidths = useCallback(
    (title: number, cols: Record<TListPropertyColumn, number>) => {
      if (!storageKey) return;
      setValue({ title, columns: cols });
    },
    [storageKey, setValue]
  );

  const resizeColumn = useCallback(
    (column: TListGridResizableColumn, widthPx: number) => {
      const clamped = clampListColumnWidthPx(column, widthPx);

      if (column === "title") {
        setTitleWidthPx(clamped);
        persistWidths(clamped, columnWidthsPx);
        return;
      }

      setColumnWidthsPx((prev) => {
        const next = { ...prev, [column]: clamped };
        persistWidths(titleWidthPx, next);
        return next;
      });
    },
    [columnWidthsPx, persistWidths, titleWidthPx]
  );

  const resizeColumnByDelta = useCallback(
    (column: TListGridResizableColumn, deltaPx: number) => {
      const current =
        column === "title" ? titleWidthPx : (columnWidthsPx[column] ?? getDefaultListGridColumnWidths(columns)[column]);
      resizeColumn(column, current + deltaPx);
    },
    [columnWidthsPx, columns, resizeColumn, titleWidthPx]
  );

  const propertyGridTemplateColumns = useMemo(
    () => buildListPropertyGridTemplateColumns(columns, columnWidthsPx, { expandToFill: true }),
    [columns, columnWidthsPx]
  );

  const propertiesPanelWidthPx = useMemo(
    () => computeListPropertiesPanelWidthPx(columns, columnWidthsPx),
    [columns, columnWidthsPx]
  );

  const layoutGridTemplateColumns = useMemo(
    () => buildListLayoutGridTemplateColumns(titleWidthPx, propertiesPanelWidthPx),
    [titleWidthPx, propertiesPanelWidthPx]
  );

  const value = useMemo(
    () => ({
      columns,
      propertyGridTemplateColumns,
      propertiesPanelWidthPx,
      layoutGridTemplateColumns,
      titleWidthPx,
      columnWidthsPx,
      resizeColumn,
      resizeColumnByDelta,
    }),
    [
      columns,
      propertyGridTemplateColumns,
      propertiesPanelWidthPx,
      layoutGridTemplateColumns,
      titleWidthPx,
      columnWidthsPx,
      resizeColumn,
      resizeColumnByDelta,
    ]
  );

  return <ListGridColumnsContext.Provider value={value}>{children}</ListGridColumnsContext.Provider>;
}

export function useListGridColumnsContext(): TListGridColumnsContextValue {
  const ctx = useContext(ListGridColumnsContext);
  if (!ctx) {
    throw new Error("useListGridColumnsContext must be used within ListGridColumnsProvider");
  }
  return ctx;
}

export function useListGridColumnsContextOptional(): TListGridColumnsContextValue | null {
  return useContext(ListGridColumnsContext);
}
