"use client";

import type { ReactNode } from "react";
import { ExternalLink, FileText } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import type { TClient360DetailResponse } from "@operis/types";
import { Client360GuestShareButton } from "@/components/board/client-360/client-360-guest-share-button";
import { Client360HealthScoreBadge } from "@/components/board/client-360/client-360-health-score-badge";
import { Client360HealthDimensionChips } from "@/components/board/client-360/client-360-health-dimension-chips";
import { Client360QbrExportMenu } from "@/components/board/client-360/client-360-qbr-export-menu";
import type { Client360QbrExportParams } from "@/components/board/client-360/use-client-360-qbr-export";
import { Client360WeekNav } from "@/components/board/client-360/client-360-week-nav";

type Props = {
  backLink: ReactNode;
  logo: ReactNode;
  data: TClient360DetailResponse;
  period: { start: string; end: string };
  onPeriodChange: (period: { start: string; end: string }) => void;
  workspaceSlug: string;
  projectId: string;
  exportParams: Client360QbrExportParams;
  onOpenProject: () => void;
  onOpenStatusReports: () => void;
};

function MetaDot() {
  return (
    <span className="text-tertiary/60" aria-hidden>
      ·
    </span>
  );
}

export function Client360DetailHeader({
  backLink,
  logo,
  data,
  period,
  onPeriodChange,
  workspaceSlug,
  projectId,
  exportParams,
  onOpenProject,
  onOpenStatusReports,
}: Props) {
  const { t } = useTranslation();

  const hasStakeholder = Boolean(data.responsible_stakeholder?.trim());
  const hasResponsible = Boolean(data.project_lead?.display_name?.trim());
  const showPeopleMeta = hasStakeholder || hasResponsible;

  return (
    <header className="flex flex-col gap-3">
      {/* Toolbar: navegação + semana */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {backLink}
        <Client360WeekNav period={period} onPeriodChange={onPeriodChange} compact />
      </div>

      {/* Identidade + acções */}
      <div className="shadow-xs flex flex-col gap-3 rounded-xl border border-subtle bg-layer-1/80 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3.5">
          <span className="shadow-xs grid size-10 shrink-0 place-items-center rounded-lg border border-subtle bg-layer-2">
            {logo}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h1 className="text-15 leading-tight font-semibold tracking-tight text-primary">{data.name}</h1>
              <Client360HealthScoreBadge
                health={data.health}
                healthScore={data.health_score}
                healthBreakdown={data.health_breakdown}
                showScore={data.display?.health_score_enabled ?? false}
              />
              {data.display?.health_score_enabled && data.health_dimensions?.length ? (
                <Client360HealthDimensionChips dimensions={data.health_dimensions} compact />
              ) : null}
            </div>

            {showPeopleMeta ? (
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-12 text-tertiary">
                {hasStakeholder ? (
                  <span>
                    {t("boards.client_360.stakeholder")}:{" "}
                    <span className="text-secondary">{data.responsible_stakeholder}</span>
                  </span>
                ) : null}
                {hasResponsible ? (
                  <>
                    {hasStakeholder ? <MetaDot /> : null}
                    <span>
                      {t("boards.client_360.responsible")}:{" "}
                      <span className="text-secondary">{data.project_lead?.display_name}</span>
                    </span>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          <Client360GuestShareButton
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            periodStart={period.start}
            periodEnd={period.end}
            variant="secondary"
            size="lg"
          />
          <Client360QbrExportMenu params={exportParams} buttonVariant="secondary" buttonSize="lg" />
          <span className="bg-subtle mx-0.5 hidden h-4 w-px shrink-0 self-center sm:block" aria-hidden />
          <Button variant="primary" size="lg" className="shrink-0" onClick={onOpenProject}>
            <ExternalLink className="size-3.5" strokeWidth={1.75} />
            {t("boards.open_project")}
          </Button>
          <Button variant="secondary" size="lg" className="shrink-0" onClick={onOpenStatusReports}>
            <FileText className="size-3.5" strokeWidth={1.75} />
            {t("boards.client_360.open_status_reports")}
          </Button>
        </div>
      </div>
    </header>
  );
}
