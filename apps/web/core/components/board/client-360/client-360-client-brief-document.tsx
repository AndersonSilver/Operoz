"use client";

import { AlertTriangle, CheckCircle2, Clock, FileText, Headphones, Lightbulb, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import type { TClient360DetailResponse } from "@operoz/types";
import { cn, renderFormattedDate } from "@operoz/utils";
import { AssistantMarkdownContent } from "@/components/assistant/assistant-markdown-content";
import { Client360HealthBadge } from "@/components/board/client-360/client-360-health-badge";
import {
  buildClient360ClientBriefActions,
  coverageLabel,
} from "@/components/board/client-360/build-client-360-client-brief-md";
import { client360HealthScoreTone } from "@/components/board/client-360/client-360-health-score.utils";
import { CLIENT_360_TONE, type Client360Tone } from "@/components/board/client-360/client-360-tokens";

type Props = {
  data: TClient360DetailResponse;
  period: { start: string; end: string };
  markdown?: string;
  className?: string;
};

function BriefMetric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: Client360Tone;
}) {
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
    <div className="min-w-0 bg-layer-1 px-3 py-3 text-center">
      <dt className="text-10 font-medium tracking-wide text-tertiary uppercase">{label}</dt>
      <dd className={cn("mt-1.5 text-18 font-semibold tabular-nums", valueClass)}>{value}</dd>
      <span className={cn("mx-auto mt-2 block h-0.5 w-8 rounded-full", token.dot)} aria-hidden />
    </div>
  );
}

function BriefSection({
  icon: Icon,
  title,
  children,
  tone = "neutral",
}: {
  icon: typeof FileText;
  title: string;
  children: ReactNode;
  tone?: Client360Tone;
}) {
  const token = CLIENT_360_TONE[tone];

  return (
    <section className="overflow-hidden rounded-xl border border-subtle bg-layer-1">
      <div className="flex items-center gap-2.5 border-b border-subtle bg-gradient-to-r from-layer-1 to-layer-2/30 px-4 py-3">
        <span className={cn("grid size-7 shrink-0 place-items-center rounded-md", token.iconBg)}>
          <Icon className={cn("size-3.5", token.icon)} strokeWidth={1.75} />
        </span>
        <h3 className="text-12 font-semibold tracking-tight text-primary">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Client360ClientBriefDocument({ data, period, markdown, className }: Props) {
  const { t } = useTranslation();
  const periodLabel = `${renderFormattedDate(period.start)} — ${renderFormattedDate(period.end)}`;
  const scoreTone = client360HealthScoreTone(data.health);
  const tone = CLIENT_360_TONE[scoreTone];

  const sr = data.status_report;
  const reportTone: Client360Tone =
    sr.coverage === "missing" ? "danger" : sr.coverage === "partial" ? "warning" : "success";
  const overdueTone: Client360Tone = data.issues.overdue > 0 ? "danger" : "success";
  const supportTone: Client360Tone = data.support.open_count > 0 ? "warning" : "neutral";

  const gapModules = data.modules.filter((m) => m.status === "missing" || m.status === "draft");
  const actions = buildClient360ClientBriefActions(data);

  if (markdown && !gapModules.length && !data.overdue_issues.length && !data.support_issues.length) {
    return (
      <div className={cn("rounded-xl border border-subtle bg-layer-1 px-5 py-4", className)}>
        <AssistantMarkdownContent content={markdown} className="text-13 leading-relaxed" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
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
              <p className="mt-1 text-12 text-secondary">{periodLabel}</p>
            </div>
            <Client360HealthBadge health={data.health} />
          </div>
          <div className="mt-4 flex items-end gap-1.5">
            <span className={cn("font-mono text-36 leading-none font-semibold tabular-nums", tone.icon)}>
              {data.health_score}
            </span>
            <span className="pb-1 text-13 text-tertiary">/100</span>
          </div>
          <p className="mt-3 text-13 leading-relaxed text-secondary">
            {t("boards.client_360.client_brief_lead", {
              coverage: coverageLabel(sr.coverage),
              published: sr.modules_published,
              total: sr.modules_total,
            })}
          </p>
        </div>
      </article>

      <section className="overflow-hidden rounded-xl border border-subtle bg-layer-2/20">
        <dl className="bg-subtle grid grid-cols-2 gap-px sm:grid-cols-4">
          <BriefMetric
            label={t("boards.client_360.client_brief_metric_report")}
            value={`${sr.modules_published}/${sr.modules_total}`}
            tone={reportTone}
          />
          <BriefMetric
            label={t("boards.client_360.client_brief_metric_overdue")}
            value={data.issues.overdue}
            tone={overdueTone}
          />
          <BriefMetric
            label={t("boards.client_360.client_brief_metric_support")}
            value={data.support.open_count}
            tone={supportTone}
          />
          <BriefMetric
            label={t("boards.client_360.client_brief_metric_open")}
            value={data.issues.pending}
            tone="neutral"
          />
        </dl>
      </section>

      {gapModules.length > 0 ? (
        <BriefSection icon={FileText} title={t("boards.client_360.client_brief_section_gaps")} tone="warning">
          <ul className="space-y-2">
            {gapModules.slice(0, 10).map((mod) => (
              <li
                key={mod.module_id ?? "project"}
                className="flex items-start gap-2 rounded-lg border border-subtle/80 bg-layer-2/20 px-3 py-2"
              >
                <span
                  className={cn(
                    "mt-1 size-2 shrink-0 rounded-full",
                    mod.status === "missing" ? "bg-danger-primary/70" : "bg-warning-primary/70"
                  )}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 text-13 text-primary">{mod.module_name ?? data.name}</span>
                <span className="shrink-0 text-11 text-tertiary">
                  {mod.status === "missing"
                    ? t("boards.client_360.report_missing")
                    : t("boards.client_360.report_partial")}
                </span>
              </li>
            ))}
          </ul>
        </BriefSection>
      ) : null}

      {data.overdue_issues.length > 0 ? (
        <BriefSection icon={Clock} title={t("boards.client_360.client_brief_section_overdue")} tone="danger">
          <ul className="space-y-2">
            {data.overdue_issues.slice(0, 6).map((issue) => (
              <li
                key={issue.id}
                className="rounded-lg border border-subtle/80 bg-layer-2/20 px-3 py-2 text-13 text-primary"
              >
                <span className="font-medium text-secondary">#{issue.sequence_id}</span> {issue.name}
              </li>
            ))}
          </ul>
        </BriefSection>
      ) : null}

      {data.support_issues.length > 0 ? (
        <BriefSection icon={Headphones} title={t("boards.client_360.client_brief_section_support")} tone="warning">
          <ul className="space-y-2">
            {data.support_issues.slice(0, 6).map((issue) => (
              <li
                key={issue.id}
                className="rounded-lg border border-subtle/80 bg-layer-2/20 px-3 py-2 text-13 text-primary"
              >
                <span className="font-medium text-secondary">#{issue.sequence_id}</span> {issue.name}
              </li>
            ))}
          </ul>
        </BriefSection>
      ) : null}

      <BriefSection icon={Lightbulb} title={t("boards.client_360.client_brief_section_actions")} tone="accent">
        <ul className="space-y-2">
          {actions.map((action) => (
            <li key={action} className="flex items-start gap-2.5 text-13 leading-relaxed text-secondary">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-accent-primary" strokeWidth={1.75} />
              {action}
            </li>
          ))}
        </ul>
      </BriefSection>

      {data.health === "critical" || sr.coverage === "missing" ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-warning-subtle bg-warning-subtle/15 px-4 py-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-primary" strokeWidth={1.75} />
          <p className="text-13 leading-relaxed text-secondary">{t("boards.client_360.client_brief_alert")}</p>
        </div>
      ) : null}

      <p className="rounded-lg border border-dashed border-subtle/80 bg-layer-2/15 px-3 py-2.5 text-11 leading-relaxed text-tertiary">
        {t("boards.client_360.client_brief_footer")}
      </p>
    </div>
  );
}

export function Client360ClientBriefEmptyState({
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
        <Sparkles className="size-5 text-accent-primary" strokeWidth={1.75} />
      </span>
      <p className="mt-4 max-w-sm text-14 font-semibold text-primary">
        {t("boards.client_360.client_brief_empty_title")}
      </p>
      <p className="mt-2 max-w-sm text-13 leading-relaxed text-tertiary">
        {t("boards.client_360.ai_placeholder_client")}
      </p>
      <Button variant="primary" size="sm" loading={generating} onClick={onGenerate} className="mt-5 gap-1.5">
        <Sparkles className="size-3.5" strokeWidth={1.75} />
        {t("boards.client_360.ai_generate")}
      </Button>
    </div>
  );
}

export function Client360ClientBriefGenerateButton({
  hasBrief,
  loading,
  onClick,
}: {
  hasBrief: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Button variant="primary" size="sm" loading={loading} onClick={onClick} className="shadow-sm gap-1.5">
      <Sparkles className="size-3.5" strokeWidth={1.75} />
      {hasBrief ? t("boards.client_360.ai_regenerate") : t("boards.client_360.ai_generate")}
    </Button>
  );
}
