import type { ReactNode } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@operis/i18n";
import type { IIssueDisplayProperties } from "@operis/types";
import { cn } from "@operis/utils";
import {
  getListPropertyColumnMeta,
  getListPropertyColumnTitleKey,
  type TListPropertyColumnAlign,
} from "../properties/list-property-columns";
import { ListColumnResizeHandle } from "./list-column-resize-handle";
import { LIST_GRID_ROW_GAP, useListGridColumnsContext } from "./list-grid-columns-context";

type Props = {
  displayProperties: IIssueDisplayProperties;
  isEpic?: boolean;
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
    <div className={cn("flex min-h-6 min-w-0 w-full items-center px-0.5", headerCellAlign[align])}>{children}</div>
  );
}

export const ListPropertiesColumnsHeader = observer(function ListPropertiesColumnsHeader(props: Props) {
  const { isEpic: _isEpic = false } = props;
  const { t } = useTranslation();
  const { columns, layoutGridTemplateColumns, propertyGridTemplateColumns, resizeColumnByDelta } =
    useListGridColumnsContext();

  if (!columns.length) return null;

  return (
    <div
      className={cn(
        "hidden w-full min-w-0 items-center border-b border-subtle bg-layer-2/80 sm:grid",
        "py-2 pr-3 pl-3"
      )}
      style={{ gridTemplateColumns: layoutGridTemplateColumns }}
    >
      <div className="group/column-header relative min-w-0 pr-3">
        <ListHeaderCell align="start">
          <span className="w-full truncate text-left text-caption-sm-medium text-tertiary">
            {t("common.work_item")}
          </span>
        </ListHeaderCell>
        <ListColumnResizeHandle column="title" onResizeByDelta={resizeColumnByDelta} />
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
                <span
                  className={cn(
                    "w-full truncate text-caption-sm-medium text-tertiary",
                    headerTextAlign[align]
                  )}
                >
                  {t(getListPropertyColumnTitleKey(column))}
                </span>
              </ListHeaderCell>
              <ListColumnResizeHandle column={column} onResizeByDelta={resizeColumnByDelta} />
            </div>
          );
        })}
      </div>

      <div className="w-8 shrink-0" aria-hidden />
    </div>
  );
});
