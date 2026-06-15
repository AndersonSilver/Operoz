"use client";

import { useMemo } from "react";
import { Activity, AlertTriangle, BarChart3, CheckCircle2, Clock } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import type { TClient360Client, TClient360Summary, TClient360SummaryDelta } from "@operis/types";
import type { ReactNode } from "react";
import {
  Client360AttentionPanel,
  Client360AttentionQuickFilters,
} from "@/components/board/client-360/client-360-attention-panel";
import { Client360BentoGrid, Client360BentoTile } from "@/components/board/client-360/client-360-bento";
import type { Client360FilterKey } from "@/components/board/client-360/client-360-client-filters";
import { buildClient360AttentionItems } from "@/components/board/client-360/client-360-attention";
import { Client360StackedDistribution } from "@/components/board/client-360/client-360-ui";

type Props = {
  summary: TClient360Summary;
  clients: TClient360Client[];
  basePath: string;
  onFilterChange?: (filter: Client360FilterKey) => void;
  showBoard?: boolean;
  summaryDelta?: TClient360SummaryDelta;
  showPeriodCompare?: boolean;
  sidebar?: ReactNode;
};

export function Client360PortfolioPulse({ clients, basePath, onFilterChange, showBoard, sidebar }: Props) {
  const { t } = useTranslation();

  const healthCounts = useMemo(() => {
    const counts = { ok: 0, warning: 0, critical: 0 };
    for (const c of clients) counts[c.health] += 1;
    return counts;
  }, [clients]);

  const reportCounts = useMemo(() => {
    const counts = { complete: 0, partial: 0, missing: 0, n_a: 0 };
    for (const c of clients) counts[c.status_report.coverage] += 1;
    return counts;
  }, [clients]);

  const overdueTop = useMemo(
    () =>
      [...clients]
        .filter((c) => c.issues.overdue > 0)
        .sort((a, b) => b.issues.overdue - a.issues.overdue)
        .slice(0, 5),
    [clients]
  );

  const attentionItems = useMemo(() => buildClient360AttentionItems(clients), [clients]);
  const total = clients.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-4 lg:items-stretch">
        <div className="flex min-h-0 min-w-0 flex-col gap-4 lg:col-span-3 lg:h-full">
          <Client360BentoTile
            className="shrink-0"
            bodyClassName="p-3"
            title={t("boards.client_360.attention_title")}
            icon={AlertTriangle}
            iconTone="neutral"
            badge={attentionItems.length || undefined}
            action={
              onFilterChange ? (
                <Client360AttentionQuickFilters clients={clients} onFilterChange={onFilterChange} />
              ) : undefined
            }
          >
            <Client360AttentionPanel
              embedded
              filtersInHeader
              clients={clients}
              basePath={basePath}
              onFilterChange={onFilterChange}
              showBoard={showBoard}
            />
          </Client360BentoTile>

          {total > 0 ? (
            <Client360BentoGrid className="min-h-0 flex-1 md:h-full md:grid-rows-1 md:items-stretch">
              <Client360BentoTile
                className="h-full md:col-span-4"
                title={t("boards.client_360.chart_health_title")}
                icon={Activity}
                iconTone="neutral"
              >
                <Client360StackedDistribution
                  total={total}
                  segments={[
                    {
                      key: "critical",
                      label: t("boards.client_360.health_critical"),
                      value: healthCounts.critical,
                      tone: "danger",
                    },
                    {
                      key: "warning",
                      label: t("boards.client_360.health_warning"),
                      value: healthCounts.warning,
                      tone: "warning",
                    },
                    {
                      key: "ok",
                      label: t("boards.client_360.health_ok"),
                      value: healthCounts.ok,
                      tone: "success",
                    },
                  ]}
                />
              </Client360BentoTile>

              <Client360BentoTile
                className="h-full md:col-span-4"
                title={t("boards.client_360.chart_report_title")}
                icon={BarChart3}
                iconTone="neutral"
              >
                <Client360StackedDistribution
                  total={total}
                  segments={[
                    {
                      key: "missing",
                      label: t("boards.client_360.report_missing"),
                      value: reportCounts.missing,
                      tone: "danger",
                    },
                    {
                      key: "partial",
                      label: t("boards.client_360.report_partial"),
                      value: reportCounts.partial,
                      tone: "warning",
                    },
                    {
                      key: "complete",
                      label: t("boards.client_360.report_complete"),
                      value: reportCounts.complete,
                      tone: "success",
                    },
                    {
                      key: "n_a",
                      label: t("boards.client_360.report_na"),
                      value: reportCounts.n_a,
                      tone: "neutral",
                    },
                  ]}
                />
              </Client360BentoTile>

              <Client360BentoTile
                className="h-full md:col-span-4"
                title={t("boards.client_360.chart_overdue_title")}
                icon={Clock}
                iconTone="neutral"
                badge={overdueTop.length || undefined}
              >
                {overdueTop.length > 0 ? (
                  <ul className="divide-y divide-subtle rounded-lg border border-subtle/80">
                    {overdueTop.map((c) => (
                      <li key={c.project_id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                        <span className="min-w-0 truncate text-12 text-secondary">{c.name}</span>
                        <span className="shrink-0 text-12 font-semibold text-primary tabular-nums">
                          {c.issues.overdue}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="flex items-center gap-2 rounded-lg border border-subtle/80 bg-layer-2/30 px-3 py-2.5 text-12 text-tertiary">
                    <CheckCircle2 className="size-3.5 shrink-0 text-success-primary" strokeWidth={1.75} />
                    {t("boards.client_360.chart_overdue_empty")}
                  </p>
                )}
              </Client360BentoTile>
            </Client360BentoGrid>
          ) : null}
        </div>

        {sidebar ? <div className="hidden min-h-0 lg:col-span-1 lg:flex lg:flex-col">{sidebar}</div> : null}
      </div>

      {sidebar ? <div className="lg:hidden">{sidebar}</div> : null}
    </div>
  );
}
