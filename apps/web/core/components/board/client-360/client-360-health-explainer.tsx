"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HeartPulse, RefreshCw } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import type { TClient360DetailResponse } from "@operis/types";
import { Client360Section } from "@/components/board/client-360/client-360-ui";
import { Client360HealthExplainerDocument } from "@/components/board/client-360/client-360-health-explainer-document";
import { hasClient360HealthScoreData } from "@/components/board/client-360/client-360-health-score.utils";
import { Client360HealthBreakdownSkeleton } from "@/components/board/client-360/client-360-health-breakdown";
import { WorkspaceService } from "@/services/workspace.service";

const workspaceService = new WorkspaceService();

type Props = {
  workspaceSlug: string;
  projectId: string;
  period: { start: string; end: string };
  data: TClient360DetailResponse;
  refreshSignal?: number;
  onLoadingChange?: (loading: boolean) => void;
};

export function Client360HealthExplainerBody({
  workspaceSlug,
  projectId,
  period,
  data,
  refreshSignal = 0,
  onLoadingChange,
}: Props) {
  const { t } = useTranslation();
  const [fallbackMarkdown, setFallbackMarkdown] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const hasBreakdown = useMemo(
    () => hasClient360HealthScoreData(data.health_score, data.health_breakdown),
    [data.health_breakdown, data.health_score]
  );

  const explain = useCallback(async () => {
    setLoading(true);
    onLoadingChange?.(true);
    try {
      const payload = await workspaceService.getClient360HealthExplainer(workspaceSlug, projectId, {
        period_start: period.start,
        period_end: period.end,
      });
      setFallbackMarkdown(payload.explanation_md || payload.static_fallback_md || "");
    } catch {
      setFallbackMarkdown(t("boards.client_360.intelligence_explainer_fallback"));
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  }, [onLoadingChange, period.end, period.start, projectId, t, workspaceSlug]);

  useEffect(() => {
    if (hasBreakdown) return;
    void explain();
    // Só re-fetch quando o utilizador pede refresh — evita loop se `explain` mudar de identidade.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasBreakdown, refreshSignal]);

  if (hasBreakdown) {
    return <Client360HealthExplainerDocument data={data} />;
  }

  if (loading && !fallbackMarkdown) {
    return <Client360HealthBreakdownSkeleton className="rounded-xl" />;
  }

  return <Client360HealthExplainerDocument data={data} fallbackMarkdown={fallbackMarkdown} />;
}

export function Client360HealthExplainerRefreshButton({
  loading,
  onRefresh,
}: {
  loading: boolean;
  onRefresh: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Button variant="primary" size="sm" loading={loading} onClick={onRefresh}>
      <RefreshCw className="size-3.5" strokeWidth={1.75} />
      {t("boards.client_360.health_explainer_refresh")}
    </Button>
  );
}

type SectionProps = Omit<Props, "data"> & { data: TClient360DetailResponse };

export function Client360HealthExplainer(props: SectionProps) {
  const { t } = useTranslation();

  return (
    <Client360Section
      sectionId="health-explainer"
      icon={HeartPulse}
      iconTone="info"
      title={t("boards.client_360.intelligence_explainer_title")}
      description={t("boards.client_360.intelligence_explainer_subtitle")}
    >
      <Client360HealthExplainerBody {...props} />
    </Client360Section>
  );
}
