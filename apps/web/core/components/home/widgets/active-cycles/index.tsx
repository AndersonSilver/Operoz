/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import Link from "next/link";
import useSWR from "swr";
import { useTranslation } from "@plane/i18n";
import { CycleIcon } from "@plane/propel/icons";
import type { ICycle, THomeWidgetProps } from "@plane/types";

type ICycleWithStats = ICycle & {
  total_issues?: number;
  completed_issues?: number;
};
import { CycleService } from "@/services/cycle.service";
import { WidgetSection } from "../shared/widget-section";

const cycleService = new CycleService();

function isActiveCycle(cycle: ICycle): boolean {
  const status = cycle.status?.toLowerCase();
  return status === "current" || status === "active";
}

export const ActiveCyclesWidget = observer(function ActiveCyclesWidget(props: THomeWidgetProps) {
  const { workspaceSlug } = props;
  const { t } = useTranslation();

  const { data: cycles, isLoading } = useSWR(
    workspaceSlug ? `HOME_ACTIVE_CYCLES_${workspaceSlug}` : null,
    async () => {
      const response = await cycleService.getWorkspaceCycles(workspaceSlug);
      return (response as ICycleWithStats[]).filter(isActiveCycle).slice(0, 4);
    },
    { revalidateOnFocus: false }
  );

  return (
    <WidgetSection
      title={t("home.active_cycles.title")}
      action={
        <Link
          href={`/${workspaceSlug}/active-cycles`}
          className="text-13 font-medium text-accent-primary hover:text-accent-secondary"
        >
          {t("home.active_cycles.view_all")}
        </Link>
      }
    >
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-md bg-layer-2" />
          ))}
        </div>
      ) : cycles && cycles.length > 0 ? (
        <div className="flex flex-col gap-2">
          {cycles.map((cycle: ICycleWithStats) => {
            const total = cycle.total_issues ?? 0;
            const completed = cycle.completed_issues ?? 0;
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <Link
                key={cycle.id}
                href={`/${workspaceSlug}/projects/${cycle.project_id}/cycles/${cycle.id}`}
                className="rounded-lg border border-subtle bg-layer-2 p-3 transition-colors hover:bg-layer-1"
              >
                <div className="mb-2 flex items-center gap-2">
                  <CycleIcon className="size-4 text-tertiary" />
                  <span className="truncate text-13 font-medium text-primary">{cycle.name}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-accent-primary" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-1 text-11 text-tertiary">
                  {completed}/{total} {t("home.active_cycles.completed")}
                </p>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-13 text-tertiary">{t("home.active_cycles.empty")}</p>
      )}
    </WidgetSection>
  );
});
