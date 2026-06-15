import { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { AssistantService } from "@operis/services";
import { Button } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { TClient360DetailResponse } from "@operis/types";
import { renderFormattedDate } from "@operis/utils";
import { buildClient360DetailAiPayload } from "@/components/board/client-360/build-client-360-ai-payload";
import { Client360Section } from "@/components/board/client-360/client-360-ui";

const assistantService = new AssistantService();

type Props = {
  workspaceSlug: string;
  projectId: string;
  period: { start: string; end: string };
  data: TClient360DetailResponse;
};

function cacheKey(projectId: string, periodStart: string) {
  return `client360_client_brief_${projectId}_${periodStart}`;
}

export function Client360AiBriefBody({ workspaceSlug, projectId, period, data }: Props) {
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
      const { prompt } = buildClient360DetailAiPayload(data, periodLabel);
      const session = await assistantService.createSession(workspaceSlug, {
        title: t("boards.client_360.ai_title_client"),
        context: { project_id: projectId },
      });
      const response = await assistantService.sendMessage(workspaceSlug, session.id, prompt);
      const text = (response.message?.content ?? "").trim();
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
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("issue_modal_ai_error_generic"),
      });
    } finally {
      setGenerating(false);
    }
  }, [data, periodLabel, projectId, period.start, t, workspaceSlug]);

  return (
    <div className="space-y-3">
      <Button variant="primary" size="sm" loading={generating} onClick={() => void generate()}>
        {brief ? t("boards.client_360.ai_regenerate") : t("boards.client_360.ai_generate")}
      </Button>
      <div className="rounded-xl border border-dashed border-subtle bg-layer-2/20 px-4 py-4">
        {brief ? (
          <p className="text-13 leading-relaxed whitespace-pre-wrap text-secondary">{brief}</p>
        ) : (
          <p className="text-12 leading-relaxed text-tertiary">{t("boards.client_360.ai_placeholder_client")}</p>
        )}
      </div>
    </div>
  );
}

export function Client360AiBrief(props: Props) {
  const { t } = useTranslation();

  return (
    <Client360Section
      sectionId="ai-brief"
      icon={Sparkles}
      iconTone="accent"
      title={t("boards.client_360.ai_title_client")}
      description={t("boards.client_360.ai_subtitle_client")}
    >
      <Client360AiBriefBody {...props} />
    </Client360Section>
  );
}
