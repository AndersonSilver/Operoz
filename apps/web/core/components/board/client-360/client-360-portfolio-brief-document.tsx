"use client";

import { AlertTriangle, FileWarning, Sparkles, Users } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import type { TClient360Summary } from "@operoz/types";
import { cn } from "@operoz/utils";
import { AssistantMarkdownContent } from "@/components/assistant/assistant-markdown-content";
import { CLIENT_360_TONE, type Client360Tone } from "@/components/board/client-360/client-360-tokens";

export type PortfolioBriefExecutive = {
  clients: number;
  critical: number;
  warning: number;
  missingReport: number;
};

export type PortfolioBriefRisk = {
  name: string;
  score: number;
  overdue: number;
};

export type PortfolioBriefReportGap = {
  name: string;
  coverage: string;
};

export function parsePortfolioBriefMarkdown(content: string): {
  executive: PortfolioBriefExecutive | null;
  risks: PortfolioBriefRisk[];
  reportGaps: PortfolioBriefReportGap[];
  footer: string | null;
  isStructured: boolean;
} {
  const lines = (content || "").split("\n");
  let section: "none" | "executive" | "risks" | "gaps" = "none";
  const executive: PortfolioBriefExecutive = {
    clients: 0,
    critical: 0,
    warning: 0,
    missingReport: 0,
  };
  const risks: PortfolioBriefRisk[] = [];
  const reportGaps: PortfolioBriefReportGap[] = [];
  let footer: string | null = null;
  let hasExecutive = false;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("# ")) continue;

    if (trimmed.startsWith("## Resumo executivo")) {
      section = "executive";
      continue;
    }
    if (trimmed.startsWith("## Top riscos")) {
      section = "risks";
      continue;
    }
    if (trimmed.startsWith("## Lacunas de status report")) {
      section = "gaps";
      continue;
    }
    if (trimmed.startsWith("## ")) {
      section = "none";
      continue;
    }

    if (trimmed.startsWith("_") && trimmed.endsWith("_")) {
      footer = trimmed.slice(1, -1).trim();
      section = "none";
      continue;
    }

    if (section === "executive") {
      const clientsMatch = trimmed.match(/\*\*Clientes monitorizados:\*\*\s*(\d+)/i);
      if (clientsMatch) {
        executive.clients = Number(clientsMatch[1]);
        hasExecutive = true;
        continue;
      }
      const criticalWarningMatch = trimmed.match(/\*\*Críticos:\*\*\s*(\d+)\s*\|\s*\*\*Atenção:\*\*\s*(\d+)/i);
      if (criticalWarningMatch) {
        executive.critical = Number(criticalWarningMatch[1]);
        executive.warning = Number(criticalWarningMatch[2]);
        hasExecutive = true;
        continue;
      }
      const missingMatch = trimmed.match(/\*\*Reports incompletos:\*\*\s*(\d+)/i);
      if (missingMatch) {
        executive.missingReport = Number(missingMatch[1]);
        hasExecutive = true;
      }
      continue;
    }

    if (section === "risks") {
      const riskMatch = trimmed.match(/^-\s+\*\*([^*]+)\*\*\s*—\s*score\s+(\d+),\s*(\d+)\s+cards atrasados/i);
      if (riskMatch) {
        risks.push({
          name: riskMatch[1].trim(),
          score: Number(riskMatch[2]),
          overdue: Number(riskMatch[3]),
        });
      }
      continue;
    }

    if (section === "gaps") {
      const gapMatch = trimmed.match(/^-\s+(.+?)\s+\(([^)]+)\)/);
      if (gapMatch) {
        reportGaps.push({
          name: gapMatch[1].trim(),
          coverage: gapMatch[2].trim(),
        });
      }
    }
  }

  const isStructured = hasExecutive || risks.length > 0 || reportGaps.length > 0;

  return {
    executive: hasExecutive ? executive : null,
    risks,
    reportGaps,
    footer,
    isStructured,
  };
}

function scoreTone(score: number): Client360Tone {
  if (score < 50) return "danger";
  if (score < 70) return "warning";
  return "success";
}

function coverageTone(coverage: string): Client360Tone {
  const normalized = coverage.toLowerCase();
  if (normalized === "missing") return "danger";
  if (normalized === "partial") return "warning";
  return "neutral";
}

function coverageLabel(coverage: string, t: (key: string) => string): string {
  const normalized = coverage.toLowerCase();
  if (normalized === "missing") return t("boards.client_360.report_missing");
  if (normalized === "partial") return t("boards.client_360.report_partial");
  return coverage;
}

function BriefMetric({ label, value, tone = "neutral" }: { label: string; value: number; tone?: Client360Tone }) {
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

function BriefSectionHeader({ icon: Icon, title }: { icon: typeof Users; title: string }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-3">
      <span className="grid size-7 shrink-0 place-items-center rounded-md border border-subtle bg-layer-1">
        <Icon className="size-3.5 text-secondary" strokeWidth={1.75} />
      </span>
      <h3 className="text-12 font-semibold tracking-tight text-primary">{title}</h3>
    </div>
  );
}

type Props = {
  content: string;
  summary?: TClient360Summary;
  className?: string;
};

export function Client360PortfolioBriefDocument({ content, summary, className }: Props) {
  const { t } = useTranslation();
  const parsed = parsePortfolioBriefMarkdown(content);

  if (!parsed.isStructured) {
    return (
      <div className={cn("rounded-xl border border-subtle bg-layer-2/30 px-4 py-4", className)}>
        <AssistantMarkdownContent content={content} className="text-13" />
      </div>
    );
  }

  const executive =
    parsed.executive ??
    (summary
      ? {
          clients: summary.total_clients,
          critical: summary.health_critical,
          warning: summary.health_warning,
          missingReport: summary.report_missing,
        }
      : null);

  return (
    <div className={cn("space-y-4", className)}>
      {executive ? (
        <section className="overflow-hidden rounded-xl border border-subtle bg-layer-2/20">
          <BriefSectionHeader icon={Users} title={t("boards.client_360.portfolio_brief_section_exec")} />
          <dl className="bg-subtle grid grid-cols-2 gap-px border-t border-subtle/80 sm:grid-cols-4">
            <BriefMetric label={t("boards.client_360.summary_clients")} value={executive.clients} />
            <BriefMetric
              label={t("boards.client_360.summary_critical")}
              value={executive.critical}
              tone={executive.critical > 0 ? "danger" : "neutral"}
            />
            <BriefMetric
              label={t("boards.client_360.summary_warning")}
              value={executive.warning}
              tone={executive.warning > 0 ? "warning" : "neutral"}
            />
            <BriefMetric
              label={t("boards.client_360.summary_report_missing")}
              value={executive.missingReport}
              tone={executive.missingReport > 0 ? "warning" : "neutral"}
            />
          </dl>
        </section>
      ) : null}

      {parsed.risks.length > 0 ? (
        <section className="overflow-hidden rounded-xl border border-subtle bg-layer-2/20">
          <BriefSectionHeader icon={AlertTriangle} title={t("boards.client_360.portfolio_brief_section_risks")} />
          <ul className="divide-y divide-subtle/80 border-t border-subtle/80">
            {parsed.risks.map((risk) => {
              const tone = scoreTone(risk.score);
              const token = CLIENT_360_TONE[tone];
              return (
                <li key={risk.name} className="flex items-center gap-3 px-4 py-3">
                  <span className={cn("size-2 shrink-0 rounded-full", token.dot)} aria-hidden />
                  <p className="min-w-0 flex-1 truncate text-13 font-medium text-primary">{risk.name}</p>
                  <div className="flex shrink-0 items-center gap-2">
                    {risk.overdue > 0 ? (
                      <span
                        className="rounded-md border border-subtle bg-layer-1 px-2 py-0.5 text-10 font-medium text-warning-primary tabular-nums"
                        title={t("boards.client_360.portfolio_brief_overdue", { count: risk.overdue })}
                      >
                        {risk.overdue}
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        "font-mono inline-flex min-w-[2.75rem] items-center justify-center rounded-md border border-subtle bg-layer-1 px-2 py-0.5 text-11 font-semibold tabular-nums",
                        tone === "danger"
                          ? "text-danger-secondary"
                          : tone === "warning"
                            ? "text-warning-primary"
                            : "text-success-primary"
                      )}
                    >
                      {risk.score}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {parsed.reportGaps.length > 0 ? (
        <section className="overflow-hidden rounded-xl border border-subtle bg-layer-2/20">
          <BriefSectionHeader icon={FileWarning} title={t("boards.client_360.portfolio_brief_section_gaps")} />
          <ul className="divide-y divide-subtle/80 border-t border-subtle/80">
            {parsed.reportGaps.map((gap) => {
              const tone = coverageTone(gap.coverage);
              const token = CLIENT_360_TONE[tone];
              return (
                <li key={gap.name} className="flex items-center gap-3 px-4 py-2.5">
                  <span className={cn("size-2 shrink-0 rounded-full", token.dot)} aria-hidden />
                  <p className="min-w-0 flex-1 truncate text-13 text-primary">{gap.name}</p>
                  <span
                    className={cn(
                      "shrink-0 rounded-md border border-subtle bg-layer-1 px-2 py-0.5 text-10 font-medium",
                      tone === "danger"
                        ? "text-danger-secondary"
                        : tone === "warning"
                          ? "text-warning-primary"
                          : "text-secondary"
                    )}
                  >
                    {coverageLabel(gap.coverage, t)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <footer className="flex items-start gap-2.5 rounded-xl border border-dashed border-subtle/80 bg-layer-2/20 px-3.5 py-3">
        <Sparkles className="mt-0.5 size-3.5 shrink-0 text-accent-primary" strokeWidth={1.75} />
        <p className="text-11 leading-relaxed text-tertiary">
          {parsed.footer ?? t("boards.client_360.portfolio_brief_footer")}
        </p>
      </footer>
    </div>
  );
}

const PREVIEW_RISK_LIMIT = 3;

function markdownPlainPreview(markdown: string, maxLength = 180): string {
  const plain = markdown
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^[-*•]\s+/gm, "")
    .replace(/\|/g, " ")
    .replace(/\s*\n+\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).trim()}…`;
}

type PreviewProps = {
  content: string;
  className?: string;
};

export function Client360PortfolioBriefPreview({ content, className }: PreviewProps) {
  const { t } = useTranslation();
  const parsed = parsePortfolioBriefMarkdown(content);

  const topRisks = parsed.risks.slice(0, PREVIEW_RISK_LIMIT);
  const moreRisks = Math.max(0, parsed.risks.length - PREVIEW_RISK_LIMIT);

  if (topRisks.length > 0) {
    return (
      <div className={cn("space-y-1.5", className)}>
        <ul className="space-y-1">
          {topRisks.map((risk) => {
            const tone = scoreTone(risk.score);
            const token = CLIENT_360_TONE[tone];
            return (
              <li key={risk.name} className="flex items-center gap-2 rounded-md bg-layer-1/60 px-2 py-1.5">
                <span className={cn("size-1.5 shrink-0 rounded-full", token.dot)} aria-hidden />
                <span className="min-w-0 flex-1 truncate text-11 font-medium text-primary">{risk.name}</span>
                <span
                  className={cn(
                    "font-mono shrink-0 text-10 font-semibold tabular-nums",
                    tone === "danger"
                      ? "text-danger-secondary"
                      : tone === "warning"
                        ? "text-warning-primary"
                        : "text-success-primary"
                  )}
                >
                  {risk.score}
                </span>
              </li>
            );
          })}
        </ul>
        {moreRisks > 0 ? (
          <p className="text-10 text-tertiary">
            {t("boards.client_360.portfolio_brief_preview_more", { count: moreRisks })}
          </p>
        ) : null}
      </div>
    );
  }

  if (parsed.reportGaps.length > 0) {
    return (
      <p className={cn("text-12 leading-relaxed text-secondary", className)}>
        {t("boards.client_360.portfolio_brief_preview_gaps", { count: parsed.reportGaps.length })}
      </p>
    );
  }

  return (
    <p className={cn("line-clamp-3 text-12 leading-relaxed text-secondary", className)}>
      {markdownPlainPreview(content)}
    </p>
  );
}
