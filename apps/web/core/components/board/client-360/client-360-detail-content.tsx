"use client";

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
import { Client360NarrativeSection } from "@/components/board/client-360/client-360-narrative-section";
import { Client360OperationalSections } from "@/components/board/client-360/client-360-operational-sections";
import type { Client360Persona } from "@/components/board/client-360/use-client-360-persona";

type DetailTab = "pulse" | "delivery" | "management" | "finops";

type Props = {
  workspaceSlug: string;
  projectId: string;
  period: { start: string; end: string };
  data: TClient360DetailResponse;
  persona: Client360Persona;
  statusReportHref: string;
  onFinopsSaved?: () => void;
};

export function Client360DetailContent({
  workspaceSlug,
  projectId,
  period,
  data,
  persona,
  statusReportHref,
  onFinopsSaved,
}: Props) {
  const { t } = useTranslation();

  const tabs: Array<{ id: DetailTab; label: string }> = [
    { id: "pulse", label: t("boards.client_360.detail_tab_pulse") },
    { id: "delivery", label: t("boards.client_360.detail_tab_delivery") },
  ];

  if (persona !== "pm") {
    tabs.push({ id: "management", label: t("boards.client_360.detail_tab_management") });
    if (data.finops) {
      tabs.push({ id: "finops", label: t("boards.client_360.detail_tab_finops") });
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Client360DetailKpiStrip data={data} />

      <Client360DetailTabs defaultValue="pulse">
        <Client360DetailTabList>
          {tabs.map(({ id, label }) => (
            <Client360DetailTabTrigger key={id} value={id}>
              {label}
            </Client360DetailTabTrigger>
          ))}
        </Client360DetailTabList>

        <Client360DetailTabPanel value="pulse">
          <Client360DetailPulse
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            period={period}
            data={data}
            persona={persona}
            statusReportHref={statusReportHref}
          />
        </Client360DetailTabPanel>

        <Client360DetailTabPanel value="delivery">
          {data.operational ? (
            <Client360OperationalSections
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              data={data}
              variant="compact"
              embedded
            />
          ) : (
            <p className="rounded-xl border border-dashed border-subtle bg-layer-2/30 px-4 py-8 text-center text-13 text-tertiary">
              {t("boards.client_360.detail_delivery_empty")}
            </p>
          )}
        </Client360DetailTabPanel>

        {persona !== "pm" ? (
          <Client360DetailTabPanel value="management">
            <Client360NarrativeSection
              key={`narrative-${projectId}-${period.start}`}
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              period={period}
            />
          </Client360DetailTabPanel>
        ) : null}

        {persona !== "pm" && data.finops ? (
          <Client360DetailTabPanel value="finops">
            <Client360FinopsSections
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              finops={data.finops}
              onFinopsSaved={onFinopsSaved}
            />
          </Client360DetailTabPanel>
        ) : null}
      </Client360DetailTabs>
    </div>
  );
}
