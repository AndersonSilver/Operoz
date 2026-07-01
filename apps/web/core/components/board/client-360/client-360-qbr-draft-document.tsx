"use client";

import { Activity, CircleHelp, FileText, Pencil, Sparkles, TrendingDown, Trophy } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { TextArea } from "@operoz/ui";
import { cn, renderFormattedDate } from "@operoz/utils";
import { AssistantMarkdownContent } from "@/components/assistant/assistant-markdown-content";
import { Client360BentoTile } from "@/components/board/client-360/client-360-bento";
import { Client360HealthBadge } from "@/components/board/client-360/client-360-health-badge";
import {
  buildClient360QbrDraftMarkdown,
  type ParsedQbrDraft,
  type ParsedQbrMetric,
} from "@/components/board/client-360/parse-client-360-qbr-draft";
import { CLIENT_360_TONE, type Client360Tone } from "@/components/board/client-360/client-360-tokens";
import type { TClient360Health } from "@operoz/types";

function mapHealthStatus(raw: string): TClient360Health {
  const normalized = raw.toLowerCase();
  if (normalized.includes("crit")) return "critical";
  if (normalized.includes("warn") || normalized.includes("aten")) return "warning";
  return "ok";
}

function metricTone(metric: ParsedQbrMetric): Client360Tone {
  if (metric.healthStatus)
    return mapHealthStatus(metric.healthStatus) === "critical"
      ? "danger"
      : mapHealthStatus(metric.healthStatus) === "warning"
        ? "warning"
        : "success";
  const normalized = `${metric.label} ${metric.value}`.toLowerCase();
  if (normalized.includes("critical") || normalized.includes("crítico")) return "danger";
  if (normalized.includes("atrasad") && !metric.value.startsWith("0")) return "danger";
  if (normalized.includes("margem")) {
    const pct = Number.parseFloat(metric.value.replace("%", ""));
    if (Number.isFinite(pct) && pct < 15) return "danger";
    if (Number.isFinite(pct)) return "success";
  }
  return "neutral";
}

function QbrMetric({ metric }: { metric: ParsedQbrMetric }) {
  const tone = metricTone(metric);
  const token = CLIENT_360_TONE[tone];
  const valueClass =
    tone === "danger"
      ? "text-danger-secondary"
      : tone === "warning"
        ? "text-warning-primary"
        : tone === "success"
          ? "text-success-primary"
          : "text-primary";

  return (
    <div className="flex min-w-0 flex-col items-center bg-layer-1 px-3 py-3 text-center">
      <dt className="text-10 font-medium tracking-wide text-tertiary uppercase">{metric.label}</dt>
      <dd className="mt-1.5 flex flex-col items-center gap-1.5">
        {metric.score != null && metric.healthStatus ? (
          <>
            <p className={cn("font-mono tabular-nums", valueClass)}>
              <span className="text-20 leading-none font-semibold">{metric.score}</span>
              <span className="ml-0.5 text-12 font-medium text-tertiary">/100</span>
            </p>
            <Client360HealthBadge health={mapHealthStatus(metric.healthStatus)} className="scale-95" />
          </>
        ) : (
          <span className={cn("text-18 font-semibold tabular-nums", valueClass)}>{metric.value}</span>
        )}
      </dd>
      <span className={cn("mt-2 block h-0.5 w-8 rounded-full", token.dot)} aria-hidden />
    </div>
  );
}

function healthTrendTone(health: string): Client360Tone {
  if (health === "critical") return "danger";
  if (health === "warning") return "warning";
  return "success";
}

function QbrDraftGuide() {
  const { t } = useTranslation();

  const items = [
    {
      title: t("boards.client_360.qbr_draft_guide_metric_health_title"),
      body: t("boards.client_360.qbr_draft_guide_metric_health"),
    },
    {
      title: t("boards.client_360.qbr_draft_guide_metric_overdue_title"),
      body: t("boards.client_360.qbr_draft_guide_metric_overdue"),
    },
    {
      title: t("boards.client_360.qbr_draft_guide_metric_support_title"),
      body: t("boards.client_360.qbr_draft_guide_metric_support"),
    },
    {
      title: t("boards.client_360.qbr_draft_guide_metric_margin_title"),
      body: t("boards.client_360.qbr_draft_guide_metric_margin"),
    },
    { title: t("boards.client_360.qbr_draft_guide_wins_title"), body: t("boards.client_360.qbr_draft_guide_wins") },
    { title: t("boards.client_360.qbr_draft_guide_risks_title"), body: t("boards.client_360.qbr_draft_guide_risks") },
  ];

  return (
    <Client360BentoTile title={t("boards.client_360.qbr_draft_guide_title")} icon={CircleHelp} iconTone="neutral">
      <p className="text-13 leading-relaxed text-secondary">{t("boards.client_360.qbr_draft_guide_intro")}</p>
      <dl className="mt-4 space-y-3">
        {items.map(({ title, body }) => (
          <div key={title} className="rounded-lg border border-subtle/80 bg-layer-2/15 px-3 py-2.5">
            <dt className="text-12 font-semibold text-primary">{title}</dt>
            <dd className="mt-1 text-12 leading-relaxed text-tertiary">{body}</dd>
          </div>
        ))}
      </dl>
    </Client360BentoTile>
  );
}

function NarrativeBlock({ content, emptyLabel }: { content: string; emptyLabel: string }) {
  const trimmed = content.trim();
  const isPlaceholder = trimmed.startsWith("_") && trimmed.endsWith("_");

  if (!trimmed || isPlaceholder) {
    return <p className="text-13 leading-relaxed text-tertiary italic">{emptyLabel}</p>;
  }

  return <AssistantMarkdownContent content={trimmed} className="text-13 leading-relaxed" inheritColor />;
}

type DocumentProps = {
  parsed: ParsedQbrDraft;
  editing: boolean;
  winsEdit: string;
  risksEdit: string;
  onWinsChange: (value: string) => void;
  onRisksChange: (value: string) => void;
};

export function Client360QbrDraftDocument({
  parsed,
  editing,
  winsEdit,
  risksEdit,
  onWinsChange,
  onRisksChange,
}: DocumentProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <article className="client-360-workspace-tile workspace-exports-form-panel overflow-hidden rounded-xl border border-subtle bg-layer-1">
        <div
          className="h-1 w-full shrink-0 bg-gradient-to-r from-warning-primary/50 via-warning-primary/15 to-transparent"
          aria-hidden
        />
        <div className="workspace-exports-hero-dot-grid px-5 py-5">
          <p className="tracking-widest text-11 font-semibold text-tertiary uppercase">Operoz QBR</p>
          <h3 className="mt-1 text-18 font-semibold tracking-tight text-primary">{parsed.clientName}</h3>
          <p className="mt-1 text-12 text-secondary">
            {t("boards.client_360.qbr_draft_quarter_label", { quarter: parsed.quarter })}
          </p>
        </div>
      </article>

      {parsed.metrics.length > 0 ? (
        <section className="overflow-hidden rounded-xl border border-subtle bg-layer-2/20">
          <dl className="bg-subtle grid grid-cols-2 gap-px sm:grid-cols-4">
            {parsed.metrics.map((metric) => (
              <QbrMetric key={metric.label} metric={metric} />
            ))}
          </dl>
        </section>
      ) : null}

      <Client360BentoTile title={t("boards.client_360.qbr_draft_section_wins")} icon={Trophy} iconTone="success">
        {editing ? (
          <TextArea
            value={winsEdit}
            onChange={(event) => onWinsChange(event.target.value)}
            rows={5}
            className="text-13 leading-relaxed"
            placeholder={t("boards.client_360.qbr_draft_wins_placeholder")}
          />
        ) : (
          <NarrativeBlock content={parsed.wins} emptyLabel={t("boards.client_360.qbr_draft_wins_empty")} />
        )}
      </Client360BentoTile>

      <Client360BentoTile title={t("boards.client_360.qbr_draft_section_risks")} icon={TrendingDown} iconTone="warning">
        {editing ? (
          <TextArea
            value={risksEdit}
            onChange={(event) => onRisksChange(event.target.value)}
            rows={5}
            className="text-13 leading-relaxed"
            placeholder={t("boards.client_360.qbr_draft_risks_placeholder")}
          />
        ) : (
          <NarrativeBlock content={parsed.risks} emptyLabel={t("boards.client_360.qbr_draft_risks_empty")} />
        )}
      </Client360BentoTile>

      {parsed.trend.length > 0 ? (
        <Client360BentoTile title={t("boards.client_360.qbr_draft_section_trend")} icon={Activity} iconTone="accent">
          <ul className="space-y-2">
            {parsed.trend.map((row) => {
              const tone = healthTrendTone(row.health);
              const token = CLIENT_360_TONE[tone];
              return (
                <li
                  key={row.period}
                  className="flex items-center justify-between gap-3 rounded-lg border border-subtle/80 bg-layer-2/20 px-3 py-2.5"
                >
                  <span className="text-12 text-secondary">{renderFormattedDate(row.period)}</span>
                  <span className="flex items-center gap-2">
                    <span className={cn("size-2 rounded-full", token.dot)} aria-hidden />
                    <span className="text-13 font-semibold text-primary tabular-nums">{row.score}</span>
                    <span className="text-11 text-tertiary">{row.health}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Client360BentoTile>
      ) : null}

      <QbrDraftGuide />

      <p className="rounded-lg border border-dashed border-subtle/80 bg-layer-2/15 px-3 py-2.5 text-11 leading-relaxed text-tertiary">
        {parsed.footer}
      </p>
    </div>
  );
}

export function Client360QbrDraftEmptyState({
  onGenerate,
  generating,
}: {
  onGenerate: () => void;
  generating: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-subtle bg-layer-2/15 px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-xl border border-subtle bg-layer-1">
        <FileText className="size-5 text-warning-primary" strokeWidth={1.75} />
      </span>
      <p className="mt-4 max-w-sm text-14 font-semibold text-primary">{t("boards.client_360.qbr_draft_empty_title")}</p>
      <p className="mt-2 max-w-sm text-13 leading-relaxed text-tertiary">
        {t("boards.client_360.intelligence_qbr_empty")}
      </p>
      <Button variant="primary" size="sm" loading={generating} onClick={onGenerate} className="mt-5 gap-1.5">
        <Sparkles className="size-3.5" strokeWidth={1.75} />
        {t("boards.client_360.intelligence_qbr_generate")}
      </Button>
    </div>
  );
}

export function Client360QbrDraftGenerateButton({
  hasDraft,
  loading,
  onClick,
}: {
  hasDraft: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Button variant="primary" size="sm" loading={loading} onClick={onClick} className="shadow-sm gap-1.5">
      <Sparkles className="size-3.5" strokeWidth={1.75} />
      {hasDraft ? t("boards.client_360.intelligence_qbr_regenerate") : t("boards.client_360.intelligence_qbr_generate")}
    </Button>
  );
}

export function Client360QbrDraftEditActions({
  editing,
  saving,
  dirty,
  onToggleEdit,
  onSave,
}: {
  editing: boolean;
  saving: boolean;
  dirty: boolean;
  onToggleEdit: () => void;
  onSave: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" size="sm" onClick={onToggleEdit} className="gap-1.5">
        <Pencil className="size-3.5" strokeWidth={1.75} />
        {editing ? t("boards.client_360.qbr_draft_preview") : t("boards.client_360.qbr_draft_edit")}
      </Button>
      {editing ? (
        <Button variant="primary" size="sm" loading={saving} disabled={!dirty || saving} onClick={onSave}>
          {t("save")}
        </Button>
      ) : null}
    </div>
  );
}

export function serializeQbrEdits(parsed: ParsedQbrDraft, wins: string, risks: string): string {
  return buildClient360QbrDraftMarkdown({
    ...parsed,
    wins,
    risks,
  });
}

export type { ParsedQbrDraft };
