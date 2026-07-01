"use client";

import type { LucideIcon } from "lucide-react";
import { Activity, AlertTriangle, Ban, CalendarRange, Clock, Headphones, LayoutList, Lightbulb, X } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import type {
  TClient360DetailResponse,
  TClient360OperationalPayload,
  TClient360ScenarioPlaybook,
  TClient360SuggestedAction,
} from "@operoz/types";
import { cn, renderFormattedDate } from "@operoz/utils";
import { Client360BentoTile } from "@/components/board/client-360/client-360-bento";
import { Client360HealthBreakdownPanel } from "@/components/board/client-360/client-360-health-breakdown";
import { Client360MilestonesList } from "@/components/board/client-360/client-360-milestones-list";
import { Client360ModuleHeatmapTable } from "@/components/board/client-360/client-360-module-heatmap-table";
import { Client360MetaChip } from "@/components/board/client-360/client-360-ui";
import { useAppRouter } from "@/hooks/use-app-router";

type IssueRow = TClient360DetailResponse["overdue_issues"][number];

type Props = {
  workspaceSlug: string;
  projectId: string;
  data: TClient360DetailResponse;
  showActions: boolean;
  showHealth: boolean;
  actions: TClient360SuggestedAction[];
  actionsLoading: boolean;
  playbooks: TClient360ScenarioPlaybook[];
  onDismissAction: (key: string) => void;
  onOpenPlaybook: (playbook: TClient360ScenarioPlaybook) => void;
  heatmap: NonNullable<TClient360DetailResponse["operational"]>["module_heatmap"];
  operational?: TClient360OperationalPayload | null;
  statusReportHref: string;
  className?: string;
};

export function Client360DetailPulseOverview({
  workspaceSlug,
  projectId,
  data,
  showActions,
  showHealth,
  actions,
  actionsLoading,
  playbooks,
  onDismissAction,
  onOpenPlaybook,
  heatmap,
  operational,
  statusReportHref,
  className,
}: Props) {
  const { t } = useTranslation();
  const projectHref = `/${workspaceSlug}/projects/${projectId}/issues`;

  const hasOverdue = data.overdue_issues.length > 0;
  const hasSupport = data.support_issues.length > 0;
  const milestones = operational?.milestones ?? [];
  const hasMilestones = milestones.length > 0;
  const blockers = operational?.blockers.items ?? [];
  const hasBlockers = blockers.length > 0;
  const slaBreached = operational?.support_sla.breached ?? false;
  const hasIssues = hasOverdue || hasSupport || hasMilestones || hasBlockers;
  const hasModules = heatmap.length > 0;

  const attentionBadge =
    (showActions ? actions.length : 0) +
      data.overdue_issues.length +
      data.support_issues.length +
      milestones.filter((m) => m.status === "overdue").length +
      blockers.length || undefined;

  if (!showActions && !showHealth && !hasIssues && !hasModules && !slaBreached) return null;

  return (
    <Client360BentoTile
      className={cn("h-full", className)}
      title={t("boards.client_360.detail_pulse_overview_title")}
      icon={Activity}
      iconTone="accent"
      badge={attentionBadge}
      noPadding
    >
      {showHealth ? (
        <div className="border-b border-subtle bg-layer-2/20 p-4">
          <PulseSectionHeader icon={Activity} title={t("boards.client_360.health_breakdown_title")} />
          <Client360HealthBreakdownPanel
            health={data.health}
            healthScore={data.health_score!}
            breakdown={data.health_breakdown!}
            compact
          />
        </div>
      ) : null}

      {slaBreached ? (
        <div className="flex items-center gap-2 border-b border-danger-subtle/80 bg-danger-subtle/10 px-4 py-2.5 text-12 text-danger-primary">
          <AlertTriangle className="size-3.5 shrink-0" strokeWidth={1.75} />
          {t("boards.client_360.sla_breach_count", {
            count: operational!.support_sla.breach_count,
            days: operational!.support_sla.sla_days,
          })}
        </div>
      ) : null}

      {showActions || hasIssues || hasModules ? (
        <div className={cn("flex flex-col gap-5 p-4", showHealth ? "pt-3" : undefined)}>
          {showActions ? (
            <section>
              <PulseSectionHeader
                icon={Lightbulb}
                title={t("boards.client_360.intelligence_actions_title")}
                badge={actions.length || undefined}
                accent="accent"
              />
              {actionsLoading ? (
                <p className="text-12 text-tertiary">{t("loading")}…</p>
              ) : actions.length === 0 ? (
                <p className="rounded-lg border border-dashed border-subtle/80 bg-layer-2/20 px-3.5 py-3 text-12 leading-relaxed text-tertiary">
                  {t("boards.client_360.intelligence_actions_empty")}
                </p>
              ) : (
                <ul className="divide-y divide-subtle overflow-hidden rounded-lg border border-subtle bg-layer-1/50">
                  {actions.map((action) => (
                    <li key={action.key} className="relative">
                      {action.href ? (
                        <Link
                          href={action.href}
                          className="block p-3.5 pr-10 transition-colors hover:bg-layer-transparent-hover"
                        >
                          <p className="text-13 leading-snug font-medium text-primary">{action.title}</p>
                          <p className="mt-0.5 text-11 leading-relaxed text-secondary">{action.reason}</p>
                        </Link>
                      ) : (
                        <div className="p-3.5 pr-10">
                          <p className="text-13 leading-snug font-medium text-primary">{action.title}</p>
                          <p className="mt-0.5 text-11 leading-relaxed text-secondary">{action.reason}</p>
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        aria-label={t("common.dismiss")}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          onDismissAction(action.key);
                        }}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          {hasIssues ? (
            <section className="flex flex-col gap-5">
              {hasOverdue ? (
                <div>
                  <PulseSectionHeader
                    icon={Clock}
                    title={t("boards.client_360.overdue_section")}
                    badge={data.overdue_issues.length}
                    accent="danger"
                  />
                  <PulseIssueList
                    issues={data.overdue_issues}
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                    showDate
                  />
                </div>
              ) : null}

              {hasSupport ? (
                <div>
                  <PulseSectionHeader
                    icon={Headphones}
                    title={t("boards.client_360.support_section")}
                    badge={data.support_issues.length}
                    accent="info"
                  />
                  <PulseIssueList
                    issues={data.support_issues}
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                    showType
                  />
                </div>
              ) : null}

              {hasMilestones ? (
                <div>
                  <PulseSectionHeader
                    icon={CalendarRange}
                    title={t("boards.client_360.milestones_title")}
                    badge={milestones.length}
                    accent={milestones.some((m) => m.status === "overdue") ? "danger" : "neutral"}
                  />
                  <Client360MilestonesList
                    milestones={milestones}
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                    maxItems={5}
                  />
                </div>
              ) : null}

              {hasBlockers ? (
                <div>
                  <PulseSectionHeader
                    icon={Ban}
                    title={t("boards.client_360.blockers_title")}
                    badge={blockers.length}
                    accent="danger"
                  />
                  <ul className="divide-y divide-subtle/80 overflow-hidden rounded-lg border border-subtle/80 bg-layer-1/50">
                    {blockers.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={`${projectHref}/${item.id}`}
                          className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 text-12 transition-colors hover:bg-layer-transparent-hover"
                        >
                          <span className="font-medium text-accent-primary">
                            #{item.sequence_id} {item.name}
                          </span>
                          <span className="text-11 text-tertiary">
                            {t("boards.client_360.blockers_aging", { days: item.aging_days })} · {item.blocked_by_name}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}

          {hasModules ? (
            <section>
              <PulseSectionHeader
                icon={LayoutList}
                title={t("boards.client_360.modules_title")}
                badge={heatmap.length}
                accent="neutral"
              />
              <div className="overflow-hidden rounded-lg border border-subtle bg-layer-1/40">
                <Client360ModuleHeatmapTable
                  embedded
                  heatmap={heatmap}
                  modules={data.modules}
                  statusReportHref={statusReportHref}
                />
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      {playbooks.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 border-t border-subtle bg-layer-2/15 px-4 py-3">
          {playbooks.map((playbook) => (
            <Button key={playbook.playbook_code} variant="secondary" size="sm" onClick={() => onOpenPlaybook(playbook)}>
              {playbook.playbook_code}
            </Button>
          ))}
        </div>
      ) : null}
    </Client360BentoTile>
  );
}

function PulseSectionHeader({
  icon: Icon,
  title,
  badge,
  accent = "neutral",
}: {
  icon: LucideIcon;
  title: string;
  badge?: number;
  accent?: "accent" | "danger" | "info" | "neutral";
}) {
  const iconToneClass =
    accent === "accent"
      ? "bg-accent-subtle text-accent-primary"
      : accent === "danger"
        ? "bg-danger-subtle text-danger-primary"
        : accent === "info"
          ? "bg-layer-2 text-secondary"
          : "bg-layer-1 text-secondary";

  return (
    <div className="mb-4 flex items-center gap-2.5 border-b border-subtle/70 pb-3">
      <span className={cn("grid size-7 shrink-0 place-items-center rounded-md border border-subtle/60", iconToneClass)}>
        <Icon className="size-3.5" strokeWidth={1.75} />
      </span>
      <h4 className="tracking-wider min-w-0 flex-1 text-10 font-semibold text-tertiary uppercase">{title}</h4>
      {badge != null ? (
        <span className="rounded-full border border-subtle bg-layer-1 px-2 py-0.5 text-10 font-semibold text-secondary tabular-nums">
          {badge}
        </span>
      ) : null}
    </div>
  );
}

function PulseIssueList({
  issues,
  workspaceSlug,
  projectId,
  showDate,
  showType,
}: {
  issues: IssueRow[];
  workspaceSlug: string;
  projectId: string;
  showDate?: boolean;
  showType?: boolean;
}) {
  const router = useAppRouter();

  return (
    <ul className="divide-y divide-subtle/80 overflow-hidden rounded-lg border border-subtle/80 bg-layer-1/50">
      {issues.map((issue) => (
        <li key={issue.id}>
          <button
            type="button"
            onClick={() => router.push(`/${workspaceSlug}/projects/${projectId}/issues/${issue.id}`)}
            className="flex w-full flex-col gap-1 px-3.5 py-2.5 text-left transition-colors hover:bg-layer-transparent-hover"
          >
            <span className="truncate text-12 font-medium text-primary">{issue.name}</span>
            <span className="flex items-center justify-between gap-3 text-11 text-tertiary">
              <span className="font-mono flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                <span>#{issue.sequence_id}</span>
                {issue.state__name ? <span>{issue.state__name}</span> : null}
                {showType && issue.type__name ? <span>{issue.type__name}</span> : null}
              </span>
              {showDate && issue.target_date ? (
                <span className="shrink-0">
                  <Client360MetaChip icon={Clock} tone="danger">
                    {renderFormattedDate(issue.target_date)}
                  </Client360MetaChip>
                </span>
              ) : null}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
