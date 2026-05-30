/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { ArrowDownWideNarrow, ArrowUpWideNarrow } from "lucide-react";
import { useTranslation } from "@plane/i18n";
// plane imports
import { getButtonStyling } from "@plane/propel/button";
// types
import { CheckIcon } from "@plane/propel/icons";
import type { TPageFiltersSortBy, TPageFiltersSortKey } from "@plane/types";
import { CustomMenu } from "@plane/ui";

type Props = {
  onChange: (value: { key?: TPageFiltersSortKey; order?: TPageFiltersSortBy }) => void;
  sortBy: TPageFiltersSortBy;
  sortKey: TPageFiltersSortKey;
};

export function PageOrderByDropdown(props: Props) {
  const { t } = useTranslation();
  const { onChange, sortBy, sortKey } = props;

  const pageSortingKeyOptions = useMemo(
    () =>
      [
        { key: "name" as const, label: t("project_page.sort.name") },
        { key: "created_at" as const, label: t("project_page.sort.date_created") },
        { key: "updated_at" as const, label: t("project_page.sort.date_modified") },
      ] satisfies { key: TPageFiltersSortKey; label: string }[],
    [t]
  );

  const orderByDetails = pageSortingKeyOptions.find((option) => sortKey === option.key);
  const isDescending = sortBy === "desc";

  return (
    <CustomMenu
      customButton={
        <div className={getButtonStyling("secondary", "lg")}>
          {!isDescending ? <ArrowUpWideNarrow className="size-3" /> : <ArrowDownWideNarrow className="size-3" />}
          {orderByDetails?.label}
        </div>
      }
      placement="bottom-end"
      maxHeight="lg"
      closeOnSelect
    >
      {pageSortingKeyOptions.map((option) => (
        <CustomMenu.MenuItem
          key={option.key}
          className="flex items-center justify-between gap-2"
          onClick={() =>
            onChange({
              key: option.key,
            })
          }
        >
          {option.label}
          {sortKey === option.key && <CheckIcon className="h-3 w-3" />}
        </CustomMenu.MenuItem>
      ))}
      <hr className="my-2 border-subtle" />
      <CustomMenu.MenuItem
        className="flex items-center justify-between gap-2"
        onClick={() => {
          if (isDescending)
            onChange({
              order: "asc",
            });
        }}
      >
        {t("project_page.sort.ascending")}
        {!isDescending && <CheckIcon className="h-3 w-3" />}
      </CustomMenu.MenuItem>
      <CustomMenu.MenuItem
        className="flex items-center justify-between gap-2"
        onClick={() => {
          if (!isDescending)
            onChange({
              order: "desc",
            });
        }}
      >
        {t("project_page.sort.descending")}
        {isDescending && <CheckIcon className="h-3 w-3" />}
      </CustomMenu.MenuItem>
    </CustomMenu>
  );
}
