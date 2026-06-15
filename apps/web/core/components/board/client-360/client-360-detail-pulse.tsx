"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Clock, ExternalLink, Headphones, Lightbulb, X } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import type { TClient360SuggestedAction, TClient360ScenarioPlaybook } from "@operis/types";
import { cn, renderFormattedDate } from "@operis/utils";
import { Client360BentoGrid, Client360BentoTile } from "@/components/board/client-360/client-360-bento";
import { Client360ScenarioPlaybookDrawer } from "@/components/board/client-360/client-360-scenario-playbook-drawer";
import { Client360HealthBreakdownPanel } from "@/components/board/client-360/client-360-health-breakdown";
import { hasClient360HealthScoreData } from "@/components/board/client-360/client-360-health-score.utils";
import {
  Client360IntelligenceRail,
  Client360IntelligencePanel,
  type Client360IntelligencePanelKind,
} from "@/components/board/client-360/client-360-intelligence-panel";
import { Client360MetaChip, Client360StatusLozenge } from "@/components/board/client-360/client-360-ui";
import { Client360HealthExplainerBody } from "@/components/board/client-360/client-360-health-explainer";
import { Client360AiBriefBody } from "@/components/board/client-360/client-360-ai-brief";
import { Client360QbrDraftBody } from "@/components/board/client-360/client-360-qbr-draft-section";
import { useClient360DetailAssistantActions } from "@/components/board/client-360/client-360-detail-assistant";
import type { TClient360DetailResponse } from "@operis/types";
import { WorkspaceService } from "@/services/workspace.service";
import { useAppRouter } from "@/hooks/use-app-router";

const workspaceService = new WorkspaceService();

type Props = {
  workspaceSlug: string;
  projectId: string;
  period: { start: string; end: string };
  data: TClient360DetailResponse;
  persona: "management" | "pm";
  statusReportHref: string;
};

export function Client360DetailPulse({ workspaceSlug, projectId, period, data, persona, statusReportHref }: Props) {
  const { t } = useTranslation();
  const [panel, setPanel] = useState<Client360IntelligencePanelKind | null>(null);
  const [actions, setActions] = useState<TClient360SuggestedAction[]>([]);
  const [playbooks, setPlaybooks] = useState<TClient360ScenarioPlaybook[]>([]);
  const [openPlaybook, setOpenPlaybook] = useState<TClient360ScenarioPlaybook | null>(null);
  const [actionsLoading, setActionsLoading] = useState(persona !== "pm");
  const { openChat } = useClient360DetailAssistantActions(projectId);

  const loadActions = useCallback(async () => {
    if (persona === "pm") return;
    setActionsLoading(true);
    try {
      const payload = await workspaceService.getClient360SuggestedActions(workspaceSlug, projectId, {
        period_start: period.start,
        period_end: period.end,
      });
      setActions(payload.actions || []);
      setPlaybooks(payload.playbooks || []);
    } catch {
      setActions([]);
      setPlaybooks([]);
    } finally {
      setActionsLoading(false);
    }
  }, [period.end, period.start, persona, projectId, workspaceSlug]);

  useEffect(() => {
    void loadActions();
  }, [loadActions]);

  const dismiss = useCallback(
    async (actionKey: string) => {
      await workspaceService.dismissClient360SuggestedAction(workspaceSlug, projectId, actionKey);
      setActions((current) => current.filter((action) => action.key !== actionKey));
    },
    [projectId, workspaceSlug]
  );

  const showHealth =
    data.display?.health_score_enabled && hasClient360HealthScoreData(data.health_score, data.health_breakdown);

  const heatmap = data.operational?.module_heatmap ?? [];
  const showActions = persona !== "pm";
  const actionsColSpan = showHealth ? "md:col-span-7 xl:col-span-8" : "md:col-span-12";

  const intelContext = {
    health: data.health,
    healthScore: data.health_score,
    showHealthScore: data.display?.health_score_enabled ?? false,
    healthScoreAlert: data.health_score_alert,
    overdueCount: data.issues.overdue,
    reportCoverage: data.status_report.coverage,
    modulesPublished: data.status_report.modules_published,
    modulesTotal: data.status_report.modules_total,
    suggestedActionsCount: actions.length,
  };

  const handleIntelOpen = (kind: Client360IntelligencePanelKind) => {
    if (kind === "assistant") {
      openChat();
      return;
    }
    setPanel(kind);
  };

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-4 xl:items-start">
        <div className="min-w-0 xl:col-span-3">
          <Client360BentoGrid>
            {showActions ? (
              <Client360BentoTile
                className={actionsColSpan}
                title={t("boards.client_360.intelligence_actions_title")}
                icon={Lightbulb}
                iconTone="accent"
                badge={actions.length || undefined}
                highlight
              >
                {actionsLoading ? (
                  <p className="text-12 text-tertiary">{t("loading")}…</p>
                ) : actions.length === 0 ? (
                  <p className="text-12 leading-relaxed text-tertiary">
                    {t("boards.client_360.intelligence_actions_empty")}
                  </p>
                ) : (
                  <ul className={cn("grid gap-2", actions.length > 1 ? "sm:grid-cols-2" : "grid-cols-1")}>
                    {actions.map((action) => (
                      <li
                        key={action.key}
                        className="flex h-full flex-col justify-between gap-3 rounded-lg border border-subtle/80 bg-layer-2/30 p-3 transition-colors hover:bg-layer-2/50"
                      >
                        <div className="border-accent-primary/60 min-w-0 border-l-2 pl-2.5">
                          <p className="text-13 leading-snug font-medium text-primary">{action.title}</p>
                          <p className="mt-1 text-11 leading-relaxed text-secondary">{action.reason}</p>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          {action.href ? (
                            <Link href={action.href} className="shrink-0">
                              <Button variant="secondary" size="sm" className="shrink-0">
                                <ExternalLink className="size-3.5" strokeWidth={1.75} />
                                {t("boards.client_360.intelligence_actions_open")}
                              </Button>
                            </Link>
                          ) : (
                            <span />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={t("common.dismiss")}
                            onClick={() => void dismiss(action.key)}
                          >
                            <X className="size-3.5" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {playbooks.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-subtle/80 pt-3">
                    {playbooks.map((playbook) => (
                      <Button
                        key={playbook.playbook_code}
                        variant="secondary"
                        size="sm"
                        onClick={() => setOpenPlaybook(playbook)}
                      >
                        {playbook.playbook_code}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </Client360BentoTile>
            ) : null}

            {showHealth ? (
              <Client360BentoTile
                className={showActions ? "md:col-span-5 xl:col-span-4" : "md:col-span-12"}
                title={t("boards.client_360.health_breakdown_title")}
                icon={Activity}
                iconTone="accent"
                highlight
              >
                <Client360HealthBreakdownPanel
                  health={data.health}
                  healthScore={data.health_score}
                  breakdown={data.health_breakdown}
                  compact
                />
              </Client360BentoTile>
            ) : null}

            {data.overdue_issues.length > 0 ? (
              <Client360BentoTile
                className="md:col-span-6"
                title={t("boards.client_360.overdue_section")}
                icon={Clock}
                iconTone="danger"
                badge={data.overdue_issues.length}
                noPadding
                highlight
              >
                <IssueList issues={data.overdue_issues} workspaceSlug={workspaceSlug} projectId={projectId} showDate />
              </Client360BentoTile>
            ) : null}

            {data.support_issues.length > 0 ? (
              <Client360BentoTile
                className="md:col-span-6"
                title={t("boards.client_360.support_section")}
                icon={Headphones}
                iconTone="info"
                badge={data.support_issues.length}
                noPadding
                highlight
              >
                <IssueList issues={data.support_issues} workspaceSlug={workspaceSlug} projectId={projectId} showType />
              </Client360BentoTile>
            ) : null}

            {heatmap.length > 0 ? (
              <Client360BentoTile
                className="md:col-span-12"
                title={t("boards.client_360.modules_title")}
                noPadding
                bodyClassName="overflow-x-auto"
              >
                <table className="w-full min-w-[480px] text-left text-12">
                  <thead>
                    <tr className="tracking-wider border-b border-subtle bg-layer-2/80 text-10 font-semibold text-tertiary uppercase">
                      <th className="px-4 py-2.5">{t("boards.client_360.module_column")}</th>
                      <th className="px-4 py-2.5">{t("boards.client_360.report_column")}</th>
                      <th className="px-4 py-2.5">{t("boards.client_360.col_overdue")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle">
                    {heatmap.map((row) => {
                      const status =
                        row.cells.report === "complete"
                          ? "published"
                          : row.cells.report === "partial"
                            ? "draft"
                            : "missing";
                      const label =
                        status === "published"
                          ? t("boards.status_report.published")
                          : status === "draft"
                            ? t("boards.status_report.draft")
                            : t("boards.client_360.report_missing");
                      const moduleRow = data.modules.find((m) => m.module_id === row.module_id);
                      return (
                        <tr
                          key={row.module_id ?? "project"}
                          className="transition-colors hover:bg-layer-transparent-hover"
                        >
                          <td className="px-4 py-2.5 font-medium text-primary">{row.module_name ?? "—"}</td>
                          <td className="px-4 py-2.5">
                            {moduleRow?.report_id ? (
                              <Link
                                href={`${statusReportHref}/${moduleRow.report_id}`}
                                className="inline-flex items-center gap-1.5 hover:underline"
                              >
                                <Client360StatusLozenge status={status} />
                                <span className="text-secondary">{label}</span>
                              </Link>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-secondary">
                                <Client360StatusLozenge status={status} />
                                {label}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-secondary tabular-nums">{row.cells.overdue}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Client360BentoTile>
            ) : null}
          </Client360BentoGrid>
        </div>

        <div className="hidden xl:col-span-1 xl:block">
          <Client360IntelligenceRail
            className="w-full"
            layout="vertical"
            context={intelContext}
            persona={persona}
            onOpen={handleIntelOpen}
          />
        </div>
      </div>

      <Client360IntelligenceRail
        className="mt-1 xl:hidden"
        context={intelContext}
        persona={persona}
        onOpen={handleIntelOpen}
      />

      {panel === "explainer" ? (
        <Client360IntelligencePanel kind="explainer" onClose={() => setPanel(null)}>
          <Client360HealthExplainerBody workspaceSlug={workspaceSlug} projectId={projectId} period={period} />
        </Client360IntelligencePanel>
      ) : null}

      {panel === "brief" ? (
        <Client360IntelligencePanel kind="brief" onClose={() => setPanel(null)}>
          <Client360AiBriefBody workspaceSlug={workspaceSlug} projectId={projectId} period={period} data={data} />
        </Client360IntelligencePanel>
      ) : null}

      {panel === "qbr" ? (
        <Client360IntelligencePanel kind="qbr" onClose={() => setPanel(null)}>
          <Client360QbrDraftBody workspaceSlug={workspaceSlug} projectId={projectId} period={period} />
        </Client360IntelligencePanel>
      ) : null}

      <Client360ScenarioPlaybookDrawer playbook={openPlaybook} onClose={() => setOpenPlaybook(null)} />
    </>
  );
}

function IssueList({
  issues,
  workspaceSlug,
  projectId,
  showDate,
  showType,
}: {
  issues: Array<{
    id: string;
    name: string;
    sequence_id: number;
    target_date: string | null;
    state__name?: string;
    type__name?: string;
  }>;
  workspaceSlug: string;
  projectId: string;
  showDate?: boolean;
  showType?: boolean;
}) {
  const router = useAppRouter();

  return (
    <ul className="divide-y divide-subtle">
      {issues.map((issue) => (
        <li key={issue.id}>
          <button
            type="button"
            onClick={() => router.push(`/${workspaceSlug}/projects/${projectId}/issues/${issue.id}`)}
            className="flex w-full flex-col gap-0.5 px-4 py-2.5 text-left transition-colors hover:bg-layer-transparent-hover"
          >
            <span className="text-13 font-medium text-primary">{issue.name}</span>
            <span className="font-mono flex flex-wrap items-center gap-x-2 gap-y-0.5 text-11 text-tertiary">
              <span>#{issue.sequence_id}</span>
              {issue.state__name ? <span>{issue.state__name}</span> : null}
              {showType && issue.type__name ? <span>{issue.type__name}</span> : null}
              {showDate && issue.target_date ? (
                <Client360MetaChip icon={Clock} tone="danger">
                  {renderFormattedDate(issue.target_date)}
                </Client360MetaChip>
              ) : null}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
