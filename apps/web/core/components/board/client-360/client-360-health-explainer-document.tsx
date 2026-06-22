"use client";

import { Activity, HeartPulse, Lightbulb } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import type { TClient360DetailResponse } from "@operis/types";
import { cn } from "@operis/utils";
import { AssistantMarkdownContent } from "@/components/assistant/assistant-markdown-content";
import { Client360BentoTile } from "@/components/board/client-360/client-360-bento";
import { Client360HealthBadge } from "@/components/board/client-360/client-360-health-badge";
import { Client360HealthBreakdownBar } from "@/components/board/client-360/client-360-health-breakdown";
import {
  buildHealthExplainerWhy,
  client360BreakdownWeightedSum,
  client360HealthDimensionLabelKey,
  client360HealthScoreTone,
  hasClient360HealthScoreData,
} from "@/components/board/client-360/client-360-health-score.utils";
import { CLIENT_360_TONE } from "@/components/board/client-360/client-360-tokens";

type Props = {
  data: TClient360DetailResponse;
  fallbackMarkdown?: string;
};

function healthLeadKey(health: TClient360DetailResponse["health"]): string {
  switch (health) {
    case "critical":
      return "boards.client_360.health_explainer_lead_critical";
    case "warning":
      return "boards.client_360.health_explainer_lead_warning";
    default:
      return "boards.client_360.health_explainer_lead_ok";
  }
}

function HealthScoreValue({ score, toneClass }: { score: number; toneClass: string }) {
  return (
    <p className={cn("font-mono tabular-nums", toneClass)}>
      <span className="text-40 leading-none font-semibold tracking-tight">{score}</span>
      <span className="text-15 ml-1 font-medium text-tertiary">/100</span>
    </p>
  );
}

export function Client360HealthExplainerDocument({ data, fallbackMarkdown }: Props) {
  const { t } = useTranslation();
  const hasBreakdown = hasClient360HealthScoreData(data.health_score, data.health_breakdown);
  const scoreTone = client360HealthScoreTone(data.health);
  const tone = CLIENT_360_TONE[scoreTone];

  if (!hasBreakdown) {
    return fallbackMarkdown ? (
      <div className="space-y-4">
        <article className="client-360-workspace-tile workspace-exports-form-panel overflow-hidden rounded-xl border border-subtle bg-layer-1">
          <div className="h-0.5 w-full shrink-0 bg-gradient-to-r from-accent-primary/40 via-accent-primary/15 to-transparent" />
          <div className="workspace-exports-hero-dot-grid px-5 py-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="tracking-widest text-11 font-semibold text-tertiary uppercase">Operoz</p>
                <h3 className="mt-1 text-18 font-semibold tracking-tight text-primary">{data.name}</h3>
              </div>
              <Client360HealthBadge health={data.health} />
            </div>
          </div>
        </article>
        <div className="rounded-xl border border-subtle bg-layer-1 px-5 py-4">
          <AssistantMarkdownContent content={fallbackMarkdown} className="text-13 leading-relaxed" />
        </div>
        <p className="text-11 leading-relaxed text-tertiary">
          {t("boards.client_360.intelligence_explainer_disclaimer")}
        </p>
      </div>
    ) : (
      <p className="rounded-xl border border-dashed border-subtle bg-layer-2/20 px-4 py-8 text-center text-13 leading-relaxed text-tertiary">
        {t("boards.client_360.intelligence_explainer_empty")}
      </p>
    );
  }

  const weightedSum = client360BreakdownWeightedSum(data.health_breakdown);
  const why = buildHealthExplainerWhy(data.health_breakdown);

  return (
    <div className="space-y-4">
      <article className="client-360-workspace-tile workspace-exports-form-panel overflow-hidden rounded-xl border border-subtle bg-layer-1">
        <div
          className="h-1 w-full shrink-0 opacity-90"
          style={{ background: `linear-gradient(90deg, ${tone.bar} 0%, transparent 100%)` }}
          aria-hidden
        />
        <div className="workspace-exports-hero-dot-grid px-5 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="tracking-widest text-11 font-semibold text-tertiary uppercase">Operoz</p>
              <h3 className="mt-1 text-18 font-semibold tracking-tight text-primary">{data.name}</h3>
            </div>
            <Client360HealthBadge health={data.health} />
          </div>

          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <HealthScoreValue score={data.health_score} toneClass={tone.icon} />
            <div className="text-right text-12 text-tertiary">
              <p>{t("boards.client_360.health_breakdown_weighted_sum", { sum: weightedSum })}</p>
              {weightedSum !== data.health_score ? (
                <p className="mt-0.5 text-11">{t("boards.client_360.health_breakdown_capped_note")}</p>
              ) : null}
            </div>
          </div>

          <p className="mt-4 text-13 leading-relaxed text-secondary">
            {t(healthLeadKey(data.health), { name: data.name, score: data.health_score })}
          </p>
        </div>
      </article>

      <Client360BentoTile
        title={t("boards.client_360.health_explainer_why_title", { score: data.health_score })}
        icon={Lightbulb}
        iconTone={scoreTone === "success" ? "success" : scoreTone}
        highlight
      >
        {why.primaryDrag ? (
          <div className="space-y-3">
            <p className="text-13 leading-relaxed text-secondary">
              {t("boards.client_360.health_explainer_why_drag", {
                score: data.health_score,
                dimension: t(client360HealthDimensionLabelKey(why.primaryDrag.dimension)),
                itemScore: why.primaryDrag.score,
                weight: why.primaryDrag.weight,
                contribution: why.primaryDrag.contribution,
                detail: why.primaryDrag.detail,
              })}
            </p>
            {why.positive.length > 0 ? (
              <p className="text-13 leading-relaxed text-secondary">
                {t("boards.client_360.health_explainer_why_positive_intro")}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-13 leading-relaxed text-secondary">
            {t("boards.client_360.health_explainer_why_balanced", { score: data.health_score })}
          </p>
        )}

        <ul className="mt-4 flex flex-wrap gap-2">
          {data.health_breakdown.map((item) => {
            const contribution = Math.round((item.score * item.weight) / 100);
            const itemTone = CLIENT_360_TONE[item.score >= 80 ? "success" : item.score >= 50 ? "warning" : "danger"];
            return (
              <li
                key={item.dimension}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border border-subtle bg-layer-2/40 px-2.5 py-1 text-11"
                )}
              >
                <span className={cn("size-1.5 rounded-full", itemTone.dot)} aria-hidden />
                <span className="font-medium text-primary">{t(client360HealthDimensionLabelKey(item.dimension))}</span>
                <span className="font-semibold text-secondary tabular-nums">+{contribution}</span>
              </li>
            );
          })}
        </ul>
      </Client360BentoTile>

      <Client360BentoTile
        title={t("boards.client_360.health_explainer_dimensions_title")}
        icon={Activity}
        iconTone={scoreTone === "success" ? "success" : scoreTone}
      >
        <div className="space-y-4">
          {data.health_breakdown.map((item) => (
            <div key={item.dimension} className="rounded-lg border border-subtle/80 bg-layer-2/20 px-3.5 py-3.5">
              <Client360HealthBreakdownBar item={item} />
            </div>
          ))}
        </div>
      </Client360BentoTile>

      {fallbackMarkdown ? (
        <Client360BentoTile
          title={t("boards.client_360.health_explainer_narrative_title")}
          icon={HeartPulse}
          iconTone="info"
        >
          <AssistantMarkdownContent content={fallbackMarkdown} className="text-13 leading-relaxed" inheritColor />
        </Client360BentoTile>
      ) : null}

      <p className="rounded-lg border border-dashed border-subtle/80 bg-layer-2/15 px-3 py-2.5 text-11 leading-relaxed text-tertiary">
        {t("boards.client_360.intelligence_explainer_disclaimer")}
      </p>
    </div>
  );
}
