"use client";

import { Bot, FileText, HeartPulse, Sparkles, X } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import type { TClient360Health, TClient360ReportCoverage } from "@operis/types";
import { cn } from "@operis/utils";
import { CLIENT_360_TONE } from "@/components/board/client-360/client-360-tokens";
import { Client360HealthBadge } from "@/components/board/client-360/client-360-health-badge";

export type Client360IntelligencePanelKind = "explainer" | "brief" | "qbr" | "assistant";

const PANEL_META: Record<
  Client360IntelligencePanelKind,
  { icon: typeof Sparkles; titleKey: string; subtitleKey: string; tone: keyof typeof CLIENT_360_TONE }
> = {
  explainer: {
    icon: HeartPulse,
    titleKey: "boards.client_360.intelligence_explainer_title",
    subtitleKey: "boards.client_360.intelligence_explainer_subtitle",
    tone: "info",
  },
  brief: {
    icon: Sparkles,
    titleKey: "boards.client_360.ai_title_client",
    subtitleKey: "boards.client_360.ai_subtitle_client",
    tone: "accent",
  },
  qbr: {
    icon: FileText,
    titleKey: "boards.client_360.intelligence_qbr_draft_title",
    subtitleKey: "boards.client_360.intelligence_qbr_draft_subtitle",
    tone: "warning",
  },
  assistant: {
    icon: Bot,
    titleKey: "boards.client_360.intelligence_chat_title",
    subtitleKey: "boards.client_360.intelligence_chat_subtitle",
    tone: "accent",
  },
};

export function Client360IntelligencePanel({
  kind,
  projectName,
  onClose,
  headerAction,
  children,
}: {
  kind: Client360IntelligencePanelKind;
  projectName?: string;
  onClose: () => void;
  headerAction?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const meta = PANEL_META[kind];
  const Icon = meta.icon;
  const tone = CLIENT_360_TONE[meta.tone];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-backdrop/70 backdrop-blur-[2px]">
      <div className="shadow-2xl flex h-full w-full max-w-lg flex-col border-l border-subtle bg-layer-1">
        <header className="relative border-b border-subtle px-5 py-4">
          <div className="absolute inset-x-0 top-0 h-1 opacity-80" style={{ backgroundColor: tone.bar }} aria-hidden />
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", tone.iconBg)}>
                <Icon className={cn("size-4", tone.icon)} strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <h2 className="text-15 font-semibold tracking-tight text-primary">{t(meta.titleKey)}</h2>
                <p className="mt-1 text-12 leading-relaxed text-tertiary">
                  {kind === "assistant" && projectName
                    ? t(meta.subtitleKey, { name: projectName })
                    : t(meta.subtitleKey)}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {headerAction}
              <Button variant="ghost" size="sm" onClick={onClose} aria-label={t("common.close")}>
                <X className="size-4" />
              </Button>
            </div>
          </div>
        </header>
        <div className={cn("flex-1 overflow-y-auto px-5 py-5")}>{children}</div>
      </div>
    </div>
  );
}

const RAIL_ITEM_TONE: Record<Client360IntelligencePanelKind, keyof typeof CLIENT_360_TONE> = {
  explainer: "info",
  brief: "accent",
  qbr: "warning",
  assistant: "accent",
};

export type Client360IntelligenceRailContext = {
  health: TClient360Health;
  healthScore?: number;
  showHealthScore?: boolean;
  healthScoreAlert?: boolean;
  overdueCount: number;
  reportCoverage: TClient360ReportCoverage;
  modulesPublished: number;
  modulesTotal: number;
  suggestedActionsCount?: number;
};

function buildIntelRailHint(
  ctx: Client360IntelligenceRailContext,
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  if (ctx.health === "critical" || ctx.healthScoreAlert) {
    return t("boards.client_360.detail_intel_rail_hint_critical");
  }
  if (ctx.overdueCount > 0) {
    return t("boards.client_360.detail_intel_rail_hint_overdue", { count: ctx.overdueCount });
  }
  if (ctx.reportCoverage === "missing" || ctx.reportCoverage === "partial") {
    return t("boards.client_360.detail_intel_rail_hint_report");
  }
  if ((ctx.suggestedActionsCount ?? 0) > 0) {
    return t("boards.client_360.detail_intel_rail_hint_actions", {
      count: ctx.suggestedActionsCount ?? 0,
    });
  }
  return t("boards.client_360.detail_intel_rail_hint_ok");
}

export function Client360IntelligenceRail({
  onOpen,
  persona = "management",
  layout = "horizontal",
  context,
  className,
}: {
  onOpen: (kind: Client360IntelligencePanelKind) => void;
  persona?: "management" | "pm";
  layout?: "horizontal" | "vertical";
  context?: Client360IntelligenceRailContext;
  className?: string;
}) {
  const { t } = useTranslation();

  const items: Array<{
    kind: Client360IntelligencePanelKind;
    label: string;
    descriptionKey: string;
    icon: typeof Sparkles;
  }> = [
    {
      kind: "explainer",
      label: t("boards.client_360.intelligence_explainer_action"),
      descriptionKey: "boards.client_360.detail_intel_rail_action_explainer_desc",
      icon: HeartPulse,
    },
    {
      kind: "brief",
      label: t("boards.client_360.ai_generate"),
      descriptionKey: "boards.client_360.detail_intel_rail_action_brief_desc",
      icon: Sparkles,
    },
    ...(persona !== "pm"
      ? [
          {
            kind: "qbr" as const,
            label: t("boards.client_360.intelligence_qbr_generate"),
            descriptionKey: "boards.client_360.detail_intel_rail_action_qbr_desc",
            icon: FileText,
          },
        ]
      : []),
    {
      kind: "assistant",
      label: t("boards.client_360.intelligence_chat_open"),
      descriptionKey: "boards.client_360.detail_intel_rail_action_chat_desc",
      icon: Bot,
    },
  ];

  const header = (
    <div className="flex items-center gap-2.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent-primary/12">
        <Sparkles className="size-4 text-accent-primary" strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <p className="text-13 font-semibold text-primary">{t("boards.client_360.detail_intel_rail_label")}</p>
        <p className="text-11 leading-relaxed text-tertiary">{t("boards.client_360.detail_intel_rail_subtitle")}</p>
      </div>
    </div>
  );

  const itemButtons = items.map(({ kind, label, descriptionKey, icon: Icon }) => {
    const tone = CLIENT_360_TONE[RAIL_ITEM_TONE[kind]];
    return (
      <button
        key={kind}
        type="button"
        onClick={() => onOpen(kind)}
        className={cn(
          "rounded-lg border border-subtle bg-layer-1 text-left transition-colors",
          "hover:border-strong hover:bg-layer-2 hover:text-primary",
          layout === "vertical"
            ? "flex w-full flex-col gap-2 px-3 py-2.5 text-left"
            : "inline-flex items-center gap-1.5 px-3 py-1.5 text-12 font-medium text-secondary"
        )}
      >
        <span className={cn("grid size-6 shrink-0 place-items-center rounded-md", tone.iconBg)}>
          <Icon className={cn("size-3.5", tone.icon)} strokeWidth={1.75} />
        </span>
        {layout === "vertical" ? (
          <span className="flex flex-col gap-0.5">
            <span className="text-12 leading-snug font-medium text-primary">{label}</span>
            <span className="text-10 leading-relaxed text-tertiary">{t(descriptionKey)}</span>
          </span>
        ) : (
          <span className="truncate">{label}</span>
        )}
      </button>
    );
  });

  const contextHint = context ? buildIntelRailHint(context, t) : null;
  const showScoreMetric = context?.showHealthScore && typeof context.healthScore === "number";

  if (layout === "vertical") {
    return (
      <aside
        className={cn(
          "shadow-xs sticky top-4 flex flex-col gap-3 rounded-xl border border-subtle bg-gradient-to-b from-layer-2/50 to-layer-1 p-4",
          className
        )}
      >
        {header}

        <p className="text-11 leading-relaxed text-tertiary">
          {contextHint ?? t("boards.client_360.detail_intel_rail_intro")}
        </p>

        {context ? (
          <dl className="grid grid-cols-3 gap-2 rounded-lg border border-subtle/80 bg-layer-2/40 px-2.5 py-2">
            <div className="min-w-0 text-center">
              <dt className="text-10 font-medium tracking-wide text-tertiary uppercase">
                {t("boards.client_360.detail_intel_rail_metric_score")}
              </dt>
              <dd className="mt-1 flex items-center justify-center gap-1">
                {showScoreMetric ? (
                  <>
                    <span className="text-14 font-semibold text-primary tabular-nums">{context.healthScore}</span>
                    <Client360HealthBadge health={context.health} className="scale-90" />
                  </>
                ) : (
                  <Client360HealthBadge health={context.health} />
                )}
              </dd>
            </div>
            <div className="min-w-0 border-x border-subtle/60 px-1 text-center">
              <dt className="text-10 font-medium tracking-wide text-tertiary uppercase">
                {t("boards.client_360.detail_intel_rail_metric_overdue")}
              </dt>
              <dd
                className={cn(
                  "mt-1 text-14 font-semibold tabular-nums",
                  context.overdueCount > 0 ? "text-danger-secondary" : "text-primary"
                )}
              >
                {context.overdueCount}
              </dd>
            </div>
            <div className="min-w-0 text-center">
              <dt className="text-10 font-medium tracking-wide text-tertiary uppercase">
                {t("boards.client_360.detail_intel_rail_metric_reports")}
              </dt>
              <dd className="mt-1 text-14 font-semibold text-primary tabular-nums">
                {context.modulesPublished}/{context.modulesTotal}
              </dd>
            </div>
          </dl>
        ) : null}

        <div className="grid grid-cols-2 gap-2">{itemButtons}</div>

        <p className="rounded-lg border border-dashed border-subtle/80 bg-layer-2/20 px-2.5 py-2 text-10 leading-relaxed text-tertiary">
          {t("boards.client_360.detail_intel_rail_tip")}
        </p>
      </aside>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-subtle bg-gradient-to-br from-layer-2/50 to-layer-1 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      {header}
      <div className="flex flex-wrap gap-2">{itemButtons}</div>
    </div>
  );
}
