"use client";

import type { LucideIcon } from "lucide-react";
import { Activity, DollarSign } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import type { TClient360DetailResponse } from "@operis/types";
import { Client360DetailKpiStrip } from "@/components/board/client-360/client-360-detail-kpi-strip";
import { Client360DetailPulse } from "@/components/board/client-360/client-360-detail-pulse";
import {
  Client360DetailTabList,
  Client360DetailTabPanel,
  Client360DetailTabTrigger,
  Client360DetailTabs,
} from "@/components/board/client-360/client-360-detail-tabs";
import { Client360FinopsSections } from "@/components/board/client-360/client-360-finops-sections";

type DetailTab = "pulse" | "finops";

type Props = {
  workspaceSlug: string;
  projectId: string;
  period: { start: string; end: string };
  data: TClient360DetailResponse;
  statusReportHref: string;
  onFinopsSaved?: () => void;
};

export function Client360DetailContent({
  workspaceSlug,
  projectId,
  period,
  data,
  statusReportHref,
  onFinopsSaved,
}: Props) {
  const { t } = useTranslation();

  const tabs: Array<{ id: DetailTab; label: string; icon: LucideIcon }> = [
    { id: "pulse", label: t("boards.client_360.detail_tab_pulse"), icon: Activity },
    { id: "finops", label: t("boards.client_360.detail_tab_finops"), icon: DollarSign },
  ];

  return (
    <Client360DetailTabs defaultValue="pulse" className="gap-5">
      <div className="shadow-xs overflow-hidden rounded-xl border border-subtle bg-layer-1">
        <Client360DetailKpiStrip data={data} embedded />
        <div className="border-t border-subtle bg-layer-2/20 px-2 py-2 sm:px-3">
          <Client360DetailTabList contained className="min-w-0 overflow-x-auto">
            {tabs.map(({ id, label, icon }) => (
              <Client360DetailTabTrigger key={id} value={id} icon={icon}>
                {label}
              </Client360DetailTabTrigger>
            ))}
          </Client360DetailTabList>
        </div>
      </div>

      <Client360DetailTabPanel value="pulse">
        <Client360DetailPulse
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          period={period}
          data={data}
          statusReportHref={statusReportHref}
        />
      </Client360DetailTabPanel>

      <Client360DetailTabPanel value="finops">
        {data.finops ? (
          <Client360FinopsSections
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            finops={data.finops}
            onFinopsSaved={onFinopsSaved}
          />
        ) : (
          <p className="rounded-xl border border-dashed border-subtle bg-layer-2/20 px-4 py-8 text-center text-13 leading-relaxed text-tertiary">
            {t("boards.client_360.finops_empty")}
          </p>
        )}
      </Client360DetailTabPanel>
    </Client360DetailTabs>
  );
}
