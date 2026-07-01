/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";

type Props = {
  className?: string;
};

export const UnscheduledBlockRow = observer(function UnscheduledBlockRow(props: Props) {
  const { className } = props;
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-4 top-1/2 flex h-7 -translate-y-1/2 items-center justify-center rounded-sm opacity-0 group-hover/gantt-row:opacity-100 transition-opacity border border-dashed border-strong-1/40",
        className
      )}
      aria-hidden
    >
      <span className="truncate px-2 text-11 text-tertiary">
        {t("issue.add.start_date")} · {t("issue.add.due_date")}
      </span>
    </div>
  );
});
