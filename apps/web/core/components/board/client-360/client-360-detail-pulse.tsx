"use client";

import { useCallback, useEffect, useState } from "react";
import type { TClient360SuggestedAction, TClient360ScenarioPlaybook } from "@operoz/types";
import { Client360DetailPulseOverview } from "@/components/board/client-360/client-360-detail-pulse-overview";
import { Client360ScenarioPlaybookDrawer } from "@/components/board/client-360/client-360-scenario-playbook-drawer";
import { hasClient360HealthScoreData } from "@/components/board/client-360/client-360-health-score.utils";
import {
  Client360IntelligencePanel,
  Client360IntelligenceRail,
  type Client360IntelligencePanelKind,
} from "@/components/board/client-360/client-360-intelligence-panel";
import { Client360DetailSidebar } from "@/components/board/client-360/client-360-detail-sidebar";
import {
  Client360HealthExplainerBody,
  Client360HealthExplainerRefreshButton,
} from "@/components/board/client-360/client-360-health-explainer";
import {
  Client360AiBriefBody,
  Client360AiBriefGenerateButton,
} from "@/components/board/client-360/client-360-ai-brief";
import {
  Client360QbrDraftBody,
  Client360QbrDraftGenerateButton,
} from "@/components/board/client-360/client-360-qbr-draft-section";
import { useClient360DetailAssistantActions } from "@/components/board/client-360/client-360-detail-assistant";
import type { TClient360DetailResponse } from "@operoz/types";
import { renderFormattedDate } from "@operoz/utils";
import { WorkspaceService } from "@/services/workspace.service";

const workspaceService = new WorkspaceService();

type Props = {
  workspaceSlug: string;
  projectId: string;
  period: { start: string; end: string };
  data: TClient360DetailResponse;
  statusReportHref: string;
};

export function Client360DetailPulse({ workspaceSlug, projectId, period, data, statusReportHref }: Props) {
  const [panel, setPanel] = useState<Client360IntelligencePanelKind | null>(null);
  const [explainerLoading, setExplainerLoading] = useState(false);
  const [explainerRefresh, setExplainerRefresh] = useState(0);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefGenerate, setBriefGenerate] = useState(0);
  const [hasBrief, setHasBrief] = useState(false);
  const [qbrLoading, setQbrLoading] = useState(false);
  const [qbrGenerate, setQbrGenerate] = useState(0);
  const [hasQbr, setHasQbr] = useState(false);
  const [actions, setActions] = useState<TClient360SuggestedAction[]>([]);
  const [playbooks, setPlaybooks] = useState<TClient360ScenarioPlaybook[]>([]);
  const [openPlaybook, setOpenPlaybook] = useState<TClient360ScenarioPlaybook | null>(null);
  const [actionsLoading, setActionsLoading] = useState(true);
  const { openChat } = useClient360DetailAssistantActions(projectId);

  const loadActions = useCallback(async () => {
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
  }, [period.end, period.start, projectId, workspaceSlug]);

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
  const showActions = true;
  const op = data.operational;
  const hasOverview =
    showActions ||
    showHealth ||
    data.overdue_issues.length > 0 ||
    data.support_issues.length > 0 ||
    heatmap.length > 0 ||
    (op?.milestones.length ?? 0) > 0 ||
    (op?.blockers.items?.length ?? 0) > 0 ||
    op?.support_sla.breached === true;

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

  const periodLabel = `${renderFormattedDate(period.start)} — ${renderFormattedDate(period.end)}`;

  const handleIntelOpen = (kind: Client360IntelligencePanelKind) => {
    if (kind === "assistant") {
      openChat();
      return;
    }
    setPanel(kind);
  };

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-2 xl:items-stretch">
        <div className="flex min-w-0 flex-col xl:min-h-0">
          {hasOverview ? (
            <Client360DetailPulseOverview
              className="flex-1"
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              data={data}
              showActions={showActions}
              showHealth={showHealth}
              actions={actions}
              actionsLoading={actionsLoading}
              playbooks={playbooks}
              heatmap={heatmap}
              operational={data.operational}
              statusReportHref={statusReportHref}
              onDismissAction={(key) => void dismiss(key)}
              onOpenPlaybook={setOpenPlaybook}
            />
          ) : null}
        </div>

        <div className="hidden xl:flex xl:min-h-0 xl:self-stretch">
          <Client360DetailSidebar className="w-full" context={intelContext} onOpen={handleIntelOpen} />
        </div>
      </div>

      <Client360IntelligenceRail className="mt-1 xl:hidden" context={intelContext} onOpen={handleIntelOpen} />

      {panel === "explainer" ? (
        <Client360IntelligencePanel
          kind="explainer"
          onClose={() => setPanel(null)}
          headerAction={
            !hasClient360HealthScoreData(data.health_score, data.health_breakdown) ? (
              <Client360HealthExplainerRefreshButton
                loading={explainerLoading}
                onRefresh={() => setExplainerRefresh((current) => current + 1)}
              />
            ) : null
          }
        >
          <Client360HealthExplainerBody
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            period={period}
            data={data}
            refreshSignal={explainerRefresh}
            onLoadingChange={setExplainerLoading}
          />
        </Client360IntelligencePanel>
      ) : null}

      {panel === "brief" ? (
        <Client360IntelligencePanel
          kind="brief"
          subtitleParams={{ period: periodLabel }}
          onClose={() => setPanel(null)}
          headerAction={
            <Client360AiBriefGenerateButton
              hasBrief={hasBrief}
              loading={briefLoading}
              onClick={() => setBriefGenerate((current) => current + 1)}
            />
          }
        >
          <Client360AiBriefBody
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            period={period}
            data={data}
            generateSignal={briefGenerate}
            onLoadingChange={setBriefLoading}
            onBriefChange={setHasBrief}
          />
        </Client360IntelligencePanel>
      ) : null}

      {panel === "qbr" ? (
        <Client360IntelligencePanel
          kind="qbr"
          onClose={() => setPanel(null)}
          headerAction={
            <div className="flex flex-wrap items-center gap-2">
              <Client360QbrDraftGenerateButton
                hasDraft={hasQbr}
                loading={qbrLoading}
                onClick={() => setQbrGenerate((current) => current + 1)}
              />
            </div>
          }
        >
          <Client360QbrDraftBody
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            period={period}
            generateSignal={qbrGenerate}
            onLoadingChange={setQbrLoading}
            onDraftChange={setHasQbr}
            panelMode
          />
        </Client360IntelligencePanel>
      ) : null}

      <Client360ScenarioPlaybookDrawer playbook={openPlaybook} onClose={() => setOpenPlaybook(null)} />
    </>
  );
}
