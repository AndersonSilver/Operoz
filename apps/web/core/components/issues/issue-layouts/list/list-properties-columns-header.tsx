import type { ReactNode } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@operoz/i18n";
import type { IIssueDisplayProperties } from "@operoz/types";
import { cn } from "@operoz/utils";
import {
  getListPropertyColumnMeta,
  getListPropertyColumnTitleKey,
  type TListPropertyColumnAlign,
} from "../properties/list-property-columns";
import { ListColumnResizeHandle } from "./list-column-resize-handle";
import {
  LIST_GRID_ROW_GAP,
  LIST_BULK_SELECT_CHECKBOX_CELL_CLASS,
  useListGridColumnsContextOptional,
} from "./list-grid-columns-context";

type Props = {
  displayProperties: IIssueDisplayProperties;
  isEpic?: boolean;
  showBulkSelectGutter?: boolean;
};

const headerCellAlign: Record<TListPropertyColumnAlign, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
};

const headerTextAlign: Record<TListPropertyColumnAlign, string> = {
  start: "text-left",
  center: "text-center",
  end: "text-right",
};

function ListHeaderCell(props: { align?: TListPropertyColumnAlign; children: ReactNode }) {
  const { align = "start", children } = props;

  return (
    <div className={cn("flex min-h-6 w-full min-w-0 items-center px-0.5", headerCellAlign[align])}>{children}</div>
  );
}

export const ListPropertiesColumnsHeader = observer(function ListPropertiesColumnsHeader(props: Props) {
  const { isEpic: _isEpic = false, showBulkSelectGutter = false } = props;
  const { t } = useTranslation();
  const gridCtx = useListGridColumnsContextOptional();
  if (!gridCtx) return null;

  const { columns, customFieldColumns, layoutGridTemplateColumns, propertyGridTemplateColumns, resizeColumnByDelta } =
    gridCtx;

  if (!columns.length && !customFieldColumns.length) return null;

  return (
    <div
      className="hidden w-full min-w-0 items-center border-b border-subtle bg-layer-2/80 py-2 pr-3 pl-3 sm:grid"
      style={{ gridTemplateColumns: layoutGridTemplateColumns }}
    >
      <div className="flex min-w-0 items-stretch pr-3">
        {showBulkSelectGutter ? <div className={LIST_BULK_SELECT_CHECKBOX_CELL_CLASS} aria-hidden /> : null}
        <div className="group/column-header relative min-w-0 flex-1">
          <ListHeaderCell align="start">
            <span className="w-full truncate text-left text-caption-sm-medium text-tertiary">
              {t("common.work_item")}
            </span>
          </ListHeaderCell>
          <ListColumnResizeHandle column="title" onResizeByDelta={resizeColumnByDelta} />
        </div>
      </div>

      <div
        className="grid min-w-0 items-center border-l border-subtle pl-3"
        style={{
          gridTemplateColumns: propertyGridTemplateColumns,
          columnGap: LIST_GRID_ROW_GAP,
        }}
      >
        {columns.map((column) => {
          const { align } = getListPropertyColumnMeta(column);

          return (
            <div key={column} className="group/column-header relative min-w-0">
              <ListHeaderCell align={align}>
                <span className={cn("w-full truncate text-caption-sm-medium text-tertiary", headerTextAlign[align])}>
                  {t(getListPropertyColumnTitleKey(column))}
                </span>
              </ListHeaderCell>
              <ListColumnResizeHandle column={column} onResizeByDelta={resizeColumnByDelta} />
            </div>
          );
        })}
        {customFieldColumns.map((field) => (
          <div key={field.id} className="relative min-w-0">
            <ListHeaderCell align="start">
              <span className="w-full truncate text-left text-caption-sm-medium text-tertiary">{field.name}</span>
            </ListHeaderCell>
          </div>
        ))}
      </div>

      <div className="w-8 shrink-0" aria-hidden />
    </div>
  );
});
