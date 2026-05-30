import { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { TClient360DetailResponse } from "@operis/types";
import { renderFormattedDate } from "@operis/utils";
import { buildClient360DetailAiPayload } from "@/components/board/client-360/build-client-360-ai-payload";
import { Client360Section } from "@/components/board/client-360/client-360-ui";
import { AIService } from "@/services/ai.service";

const aiService = new AIService();

type Props = {
  workspaceSlug: string;
  projectId: string;
  period: { start: string; end: string };
  data: TClient360DetailResponse;
};

function cacheKey(projectId: string, periodStart: string) {
  return `client360_client_brief_${projectId}_${periodStart}`;
}

export function Client360AiBrief({ workspaceSlug, projectId, period, data }: Props) {
  const { t } = useTranslation();
  const [brief, setBrief] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return sessionStorage.getItem(cacheKey(projectId, period.start));
    } catch {
      return null;
    }
  });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    try {
      setBrief(sessionStorage.getItem(cacheKey(projectId, period.start)));
    } catch {
      setBrief(null);
    }
  }, [projectId, period.start]);

  const periodLabel = `${renderFormattedDate(period.start)} — ${renderFormattedDate(period.end)}`;

  const generate = useCallback(async () => {
    setGenerating(true);
    try {
      const { task, prompt } = buildClient360DetailAiPayload(data, periodLabel);
      const res = await aiService.createGptTask(workspaceSlug, { task, prompt });
      const text = (res.response ?? res.response_html ?? "").trim();
      if (!text) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: t("issue_modal_ai_invalid_response"),
        });
        return;
      }
      setBrief(text);
      try {
        sessionStorage.setItem(cacheKey(projectId, period.start), text);
      } catch {
        /* ignore quota */
      }
    } catch (err: unknown) {
      const error = (err as { data?: { error?: string }; status?: number })?.data?.error;
      const status = (err as { status?: number })?.status;
      const message =
        status === 429
          ? error || t("issue_modal_ai_error_rate_limit")
          : error || t("issue_modal_ai_error_generic");
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message });
    } finally {
      setGenerating(false);
    }
  }, [data, periodLabel, projectId, period.start, t, workspaceSlug]);

  return (
    <Client360Section
      icon={Sparkles}
      iconTone="accent"
      title={t("boards.client_360.ai_title_client")}
      description={t("boards.client_360.ai_subtitle_client")}
      action={
        <Button variant="secondary" size="sm" loading={generating} onClick={generate}>
          {brief ? t("boards.client_360.ai_regenerate") : t("boards.client_360.ai_generate")}
        </Button>
      }
    >
      <div className="rounded-sm border border-dashed border-subtle bg-layer-2/30 px-4 py-4">
        {brief ? (
          <p className="whitespace-pre-wrap text-13 leading-relaxed text-secondary">{brief}</p>
        ) : (
          <p className="text-13 leading-relaxed text-tertiary">{t("boards.client_360.ai_placeholder_client")}</p>
        )}
      </div>
    </Client360Section>
  );
}
