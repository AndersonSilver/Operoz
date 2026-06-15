"use client";

import { useCallback, useEffect, useState } from "react";
import { DollarSign, Download, Sparkles } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { TClient360FinopsSummary, TClient360Summary } from "@operis/types";
import { cn } from "@operis/utils";
import { CLIENT_360_TONE } from "@/components/board/client-360/client-360-tokens";
import { WorkspaceService } from "@/services/workspace.service";

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

  const briefPreview = brief.trim().slice(0, 280);
  const hint = buildPortfolioHint(summary, t);

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
            label: t("boards.client_360.finops_export_csv"),
            description: t("boards.client_360.portfolio_sidebar_action_export_desc"),
            icon: Download,
            tone: "neutral" as const,
            onClick: () => void handleExportFinops(),
          },
        ]
      : []),
  ];

  return (
    <aside
      className={cn(
        "shadow-xs flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden rounded-xl border border-subtle bg-layer-1 p-4",
        className
      )}
    >
      <div className="flex shrink-0 items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-subtle bg-layer-2">
          <Sparkles className="size-4 text-secondary" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="text-13 font-semibold text-primary">{t("boards.client_360.detail_intel_rail_label")}</p>
          <p className="text-11 leading-relaxed text-tertiary">{t("boards.client_360.portfolio_sidebar_subtitle")}</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
        <p className="text-11 leading-relaxed text-secondary">{hint}</p>

        <dl className="grid grid-cols-3 gap-2 rounded-lg border border-subtle/80 bg-layer-2/40 px-2.5 py-2">
          <div className="min-w-0 text-center">
            <dt className="text-10 font-medium tracking-wide text-tertiary uppercase">
              {t("boards.client_360.summary_clients")}
            </dt>
            <dd className="mt-1 text-14 font-semibold text-primary tabular-nums">{summary.total_clients}</dd>
          </div>
          <div className="min-w-0 border-x border-subtle/60 px-1 text-center">
            <dt className="text-10 font-medium tracking-wide text-tertiary uppercase">
              {t("boards.client_360.summary_critical")}
            </dt>
            <dd
              className={cn(
                "mt-1 text-14 font-semibold tabular-nums",
                summary.health_critical > 0 ? "text-danger-secondary" : "text-primary"
              )}
            >
              {summary.health_critical}
            </dd>
          </div>
          <div className="min-w-0 text-center">
            <dt className="text-10 font-medium tracking-wide text-tertiary uppercase">
              {t("boards.client_360.summary_overdue")}
            </dt>
            <dd
              className={cn(
                "mt-1 text-14 font-semibold tabular-nums",
                summary.total_overdue > 0 ? "text-warning-primary" : "text-primary"
              )}
            >
              {summary.total_overdue}
            </dd>
          </div>
        </dl>

        <div className="grid grid-cols-2 gap-2">
          {actions.map(({ key, label, description, icon: Icon, tone, onClick, loading }) => {
            const token = CLIENT_360_TONE[tone];
            return (
              <button
                key={key}
                type="button"
                disabled={loading}
                onClick={onClick}
                className="flex flex-col gap-2 rounded-lg border border-subtle bg-layer-1 px-3 py-2.5 text-left transition-colors hover:border-strong hover:bg-layer-2"
              >
                <span className={cn("grid size-6 shrink-0 place-items-center rounded-md", token.iconBg)}>
                  <Icon className={cn("size-3.5", token.icon)} strokeWidth={1.75} />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-12 leading-snug font-medium text-primary">{label}</span>
                  <span className="line-clamp-2 text-10 leading-relaxed text-tertiary">{description}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="rounded-lg border border-subtle/80 bg-layer-2/30 px-3 py-2.5">
          <p className="text-10 font-medium tracking-wide text-tertiary uppercase">
            {t("boards.client_360.intelligence_weekly_briefing_title")}
          </p>
          {loadingBrief ? (
            <p className="mt-1.5 text-11 text-tertiary">{t("loading")}…</p>
          ) : briefPreview ? (
            <p className="mt-1.5 line-clamp-3 text-11 leading-relaxed text-secondary">{briefPreview}</p>
          ) : (
            <p className="mt-1.5 text-11 leading-relaxed text-tertiary">
              {t("boards.client_360.intelligence_weekly_briefing_empty")}
            </p>
          )}
          {brief ? (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-auto px-0 py-0"
              loading={generating}
              onClick={() => void generate()}
            >
              {t("boards.client_360.ai_regenerate")}
            </Button>
          ) : null}
        </div>

        <p className="text-10 leading-relaxed text-tertiary">{t("boards.client_360.detail_intel_rail_tip")}</p>
      </div>
    </aside>
  );
}
