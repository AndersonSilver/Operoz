import { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { AssistantService } from "@operis/services";
import { Button } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { TClient360Client, TClient360Summary } from "@operis/types";
import { renderFormattedDate } from "@operis/utils";
import { buildClient360PortfolioAiPayload } from "@/components/board/client-360/build-client-360-portfolio-ai-payload";
import { Client360Section } from "@/components/board/client-360/client-360-ui";

const assistantService = new AssistantService();

type Props = {
  workspaceSlug: string;
  period: { start: string; end: string };
  summary: TClient360Summary;
  clients: TClient360Client[];
};

function cacheKey(workspaceSlug: string, periodStart: string) {
  return `client360_portfolio_brief_${workspaceSlug}_${periodStart}`;
}

export function Client360PortfolioAiBrief({ workspaceSlug, period, summary, clients }: Props) {
  const { t } = useTranslation();
  const [brief, setBrief] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return sessionStorage.getItem(cacheKey(workspaceSlug, period.start));
    } catch {
      return null;
    }
  });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    try {
      setBrief(sessionStorage.getItem(cacheKey(workspaceSlug, period.start)));
    } catch {
      setBrief(null);
    }
  }, [workspaceSlug, period.start]);

  const periodLabel = `${renderFormattedDate(period.start)} — ${renderFormattedDate(period.end)}`;

  const generate = useCallback(async () => {
    setGenerating(true);
    try {
      const { prompt } = buildClient360PortfolioAiPayload(summary, clients, periodLabel);
      const session = await assistantService.createSession(workspaceSlug, {
        title: t("boards.client_360.ai_title_portfolio"),
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
        sessionStorage.setItem(cacheKey(workspaceSlug, period.start), text);
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
  }, [clients, periodLabel, period.start, summary, t, workspaceSlug]);

  return (
    <Client360Section
      icon={Sparkles}
      iconTone="accent"
      title={t("boards.client_360.ai_title_portfolio")}
      description={t("boards.client_360.ai_subtitle_portfolio")}
      action={
        <Button variant="secondary" size="sm" loading={generating} onClick={() => void generate()}>
          {brief ? t("boards.client_360.ai_regenerate") : t("boards.client_360.ai_generate")}
        </Button>
      }
    >
      <div className="rounded-sm border border-dashed border-subtle bg-layer-2/30 px-4 py-4">
        {brief ? (
          <p className="text-13 leading-relaxed whitespace-pre-wrap text-secondary">{brief}</p>
        ) : (
          <p className="text-13 leading-relaxed text-tertiary">{t("boards.client_360.ai_placeholder_portfolio")}</p>
        )}
      </div>
    </Client360Section>
  );
}
