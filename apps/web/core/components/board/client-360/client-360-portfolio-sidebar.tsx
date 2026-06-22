"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DollarSign, Download, Sparkles } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { TClient360FinopsSummary, TClient360Summary } from "@operis/types";
import { cn, renderFormattedDate } from "@operis/utils";
import { Client360IntelligencePanel } from "@/components/board/client-360/client-360-intelligence-panel";
import {
  Client360PortfolioBriefDocument,
  Client360PortfolioBriefPreview,
} from "@/components/board/client-360/client-360-portfolio-brief-document";
import { CLIENT_360_TONE } from "@/components/board/client-360/client-360-tokens";
import { WorkspaceService } from "@/services/workspace.service";
import "@/components/exporter/workspace-exports-settings.css";

const workspaceService = new WorkspaceService();

type Props = {
  workspaceSlug: string;
  period: { start: string; end: string };
  summary: TClient360Summary;
  finopsSummary?: TClient360FinopsSummary | null;
  showFinops?: boolean;
  onOpenFinops?: () => void;
  className?: string;
};

function buildPortfolioHint(
  summary: TClient360Summary,
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  if (summary.health_critical > 0) {
    return t("boards.client_360.portfolio_sidebar_hint_critical", { count: summary.health_critical });
  }
  if (summary.total_overdue > 0) {
    return t("boards.client_360.portfolio_sidebar_hint_overdue", { count: summary.total_overdue });
  }
  if (summary.report_missing > 0) {
    return t("boards.client_360.portfolio_sidebar_hint_report", { count: summary.report_missing });
  }
  return t("boards.client_360.portfolio_sidebar_hint_ok");
}

export function Client360PortfolioSidebar({
  workspaceSlug,
  period,
  summary,
  showFinops = false,
  onOpenFinops,
  className,
}: Props) {
  const { t } = useTranslation();
  const [brief, setBrief] = useState("");
  const [generating, setGenerating] = useState(false);
  const [loadingBrief, setLoadingBrief] = useState(true);
  const [briefOpen, setBriefOpen] = useState(false);

  const periodLabel = useMemo(
    () => `${renderFormattedDate(period.start)} — ${renderFormattedDate(period.end)}`,
    [period.end, period.start]
  );

  const loadCached = useCallback(async () => {
    setLoadingBrief(true);
    try {
      const row = await workspaceService.getClient360WeeklyBriefing(workspaceSlug, {
        period_start: period.start,
        period_end: period.end,
      });
      setBrief(row.content_md || "");
    } catch {
      setBrief("");
    } finally {
      setLoadingBrief(false);
    }
  }, [period.end, period.start, workspaceSlug]);

  useEffect(() => {
    void loadCached();
  }, [loadCached]);

  const generate = useCallback(async () => {
    setGenerating(true);
    try {
      const row = await workspaceService.generateClient360WeeklyBriefing(workspaceSlug, {
        period_start: period.start,
        period_end: period.end,
      });
      setBrief(row.content_md || "");
      if (row.status === "blocked") {
        setToast({
          type: TOAST_TYPE.WARNING,
          title: t("boards.client_360.intelligence_briefing_blocked"),
          message: t("boards.client_360.intelligence_briefing_blocked_hint"),
        });
      }
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("issue_modal_ai_error_generic"),
      });
    } finally {
      setGenerating(false);
    }
  }, [period.end, period.start, t, workspaceSlug]);

  const handleExportFinops = async () => {
    await workspaceService.downloadClient360FinopsCsv(workspaceSlug);
  };

  const hint = buildPortfolioHint(summary, t);
  const briefTrimmed = brief.trim();

  const actions = [
    {
      key: "briefing",
      label: brief ? t("boards.client_360.ai_regenerate") : t("boards.client_360.ai_generate"),
      description: t("boards.client_360.portfolio_sidebar_action_brief_desc"),
      icon: Sparkles,
      tone: "neutral" as const,
      onClick: () => void generate(),
      loading: generating,
    },
    ...(showFinops
      ? [
          {
            key: "finops",
            label: t("boards.client_360.portfolio_sidebar_action_finops"),
            description: t("boards.client_360.portfolio_sidebar_action_finops_desc"),
            icon: DollarSign,
            tone: "neutral" as const,
            onClick: () => onOpenFinops?.(),
          },
          {
            key: "export",
            label: t("boards.client_360.portfolio_sidebar_action_export_short"),
            description: t("boards.client_360.portfolio_sidebar_action_export_desc"),
            icon: Download,
            tone: "neutral" as const,
            onClick: () => void handleExportFinops(),
          },
        ]
      : []),
  ];

  return (
    <>
      <aside
        className={cn(
          "client-360-workspace-sidebar workspace-exports-history-panel flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-subtle bg-layer-1",
          className
        )}
      >
        <div className="workspace-exports-hero-dot-grid shrink-0 border-b border-subtle bg-gradient-to-br from-accent-subtle/15 via-transparent to-transparent px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-subtle bg-accent-subtle text-accent-primary">
              <Sparkles className="size-4" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="text-13 font-semibold text-primary">{t("boards.client_360.detail_intel_rail_label")}</p>
              <p className="mt-0.5 text-11 leading-relaxed text-tertiary">
                {t("boards.client_360.portfolio_sidebar_subtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col divide-y divide-subtle">
          <section className="shrink-0 px-5 py-4">
            <p className="rounded-lg border border-subtle/80 bg-layer-2/40 px-3.5 py-3 text-12 leading-relaxed text-secondary">
              {hint}
            </p>
          </section>

          <section className="shrink-0 px-5 py-4">
            <h3 className="tracking-widest mb-3 text-10 font-semibold text-tertiary uppercase">
              {t("boards.client_360.portfolio_sidebar_section_actions")}
            </h3>
            <div
              className={cn(
                "grid gap-2",
                actions.length === 1 ? "grid-cols-1" : actions.length === 2 ? "grid-cols-2" : "grid-cols-3"
              )}
            >
              {actions.map(({ key, label, description, icon: Icon, tone, onClick, loading }) => {
                const token = CLIENT_360_TONE[tone];
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={loading}
                    onClick={onClick}
                    className="flex min-w-0 flex-col gap-1.5 rounded-xl border border-subtle bg-layer-1 px-2.5 py-2.5 text-left transition-colors hover:border-strong hover:bg-layer-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className={cn("grid size-7 shrink-0 place-items-center rounded-md", token.iconBg)}>
                        <Icon className={cn("size-3.5", token.icon)} strokeWidth={1.75} />
                      </span>
                      <span className="line-clamp-2 min-w-0 text-11 leading-snug font-medium text-primary">
                        {label}
                      </span>
                    </span>
                    <span className="line-clamp-2 text-10 leading-relaxed text-tertiary">{description}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="shrink-0 px-5 py-4">
            <div className="rounded-xl border border-subtle/80 bg-layer-2/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="tracking-widest text-10 font-semibold text-tertiary uppercase">
                  {t("boards.client_360.intelligence_weekly_briefing_title")}
                </p>
                {briefTrimmed ? (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto shrink-0 px-0 py-0"
                    onClick={() => setBriefOpen(true)}
                  >
                    {t("boards.client_360.portfolio_sidebar_open_briefing")}
                  </Button>
                ) : null}
              </div>
              {loadingBrief ? (
                <p className="mt-2 text-12 text-tertiary">{t("loading")}…</p>
              ) : briefTrimmed ? (
                <button
                  type="button"
                  onClick={() => setBriefOpen(true)}
                  className="mt-3 w-full rounded-lg border border-subtle/60 bg-layer-1/50 px-3 py-2.5 text-left transition-colors hover:border-strong hover:bg-layer-1"
                >
                  <Client360PortfolioBriefPreview content={briefTrimmed} />
                </button>
              ) : (
                <p className="mt-2 text-12 leading-relaxed text-tertiary">
                  {t("boards.client_360.intelligence_weekly_briefing_empty")}
                </p>
              )}
            </div>
          </section>

          <footer className="mt-auto shrink-0 bg-layer-2/20 px-5 py-3">
            <p className="text-10 leading-relaxed text-tertiary">{t("boards.client_360.detail_intel_rail_tip")}</p>
          </footer>
        </div>
      </aside>

      {briefOpen ? (
        <Client360IntelligencePanel
          kind="portfolio_brief"
          subtitleParams={{ period: periodLabel }}
          onClose={() => setBriefOpen(false)}
          headerAction={
            <Button
              variant="primary"
              size="sm"
              loading={generating}
              onClick={() => void generate()}
              className="shadow-sm gap-1.5"
            >
              <Sparkles className="size-3.5" strokeWidth={1.75} />
              {briefTrimmed ? t("boards.client_360.ai_regenerate") : t("boards.client_360.ai_generate")}
            </Button>
          }
        >
          {loadingBrief ? (
            <p className="text-13 text-tertiary">{t("loading")}…</p>
          ) : briefTrimmed ? (
            <Client360PortfolioBriefDocument content={briefTrimmed} summary={summary} />
          ) : (
            <div className="space-y-4">
              <p className="text-13 leading-relaxed text-tertiary">
                {t("boards.client_360.intelligence_weekly_briefing_empty")}
              </p>
              <Button variant="primary" size="sm" loading={generating} onClick={() => void generate()}>
                {t("boards.client_360.ai_generate")}
              </Button>
            </div>
          )}
        </Client360IntelligencePanel>
      ) : null}
    </>
  );
}
