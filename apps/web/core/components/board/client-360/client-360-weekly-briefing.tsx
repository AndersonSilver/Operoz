import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Sparkles } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { TClient360Client, TClient360Summary } from "@operis/types";
import { renderFormattedDate } from "@operis/utils";
import { Client360Section } from "@/components/board/client-360/client-360-ui";
import { Client360PortfolioBriefDocument } from "@/components/board/client-360/client-360-portfolio-brief-document";
import { WorkspaceService } from "@/services/workspace.service";

const workspaceService = new WorkspaceService();

type Props = {
  workspaceSlug: string;
  period: { start: string; end: string };
  summary: TClient360Summary;
  clients: TClient360Client[];
};

export function Client360WeeklyBriefing({ workspaceSlug, period, summary }: Props) {
  const { t } = useTranslation();
  const [brief, setBrief] = useState<string>("");
  const [status, setStatus] = useState<string>("draft");
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadCached = useCallback(async () => {
    setLoading(true);
    try {
      const row = await workspaceService.getClient360WeeklyBriefing(workspaceSlug, {
        period_start: period.start,
        period_end: period.end,
      });
      setBrief(row.content_md || "");
      setStatus(row.status || "draft");
    } catch {
      setBrief("");
    } finally {
      setLoading(false);
    }
  }, [period.end, period.start, workspaceSlug]);

  useEffect(() => {
    void loadCached();
  }, [loadCached]);

  const generate = useCallback(async () => {
    setGenerating(true);
    try {
      const row = await workspaceService.generateClient360WeeklyBriefing(workspaceSlug, {
        period_start: period.start,
        period_end: period.end,
      });
      setBrief(row.content_md || "");
      setStatus(row.status || "draft");
      if (row.status === "blocked") {
        setToast({
          type: TOAST_TYPE.WARNING,
          title: t("boards.client_360.intelligence_briefing_blocked"),
          message: t("boards.client_360.intelligence_briefing_blocked_hint"),
        });
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
  }, [period.end, period.start, t, workspaceSlug]);

  const periodLabel = `${renderFormattedDate(period.start)} — ${renderFormattedDate(period.end)}`;

  return (
    <Client360Section
      icon={CalendarClock}
      iconTone="accent"
      title={t("boards.client_360.intelligence_weekly_briefing_title")}
      description={t("boards.client_360.intelligence_weekly_briefing_subtitle", { period: periodLabel })}
      action={
        <Button variant="secondary" size="sm" loading={generating} onClick={() => void generate()}>
          {brief ? t("boards.client_360.ai_regenerate") : t("boards.client_360.ai_generate")}
        </Button>
      }
    >
      <div className="rounded-sm border border-subtle bg-layer-2/30 px-4 py-4">
        {loading ? (
          <p className="text-13 text-tertiary">{t("loading")}…</p>
        ) : brief ? (
          <>
            {status === "published" ? (
              <p className="mb-2 inline-flex items-center gap-1 text-11 text-accent-primary">
                <Sparkles className="size-3.5" />
                {t("boards.client_360.intelligence_briefing_cached")}
              </p>
            ) : null}
            <Client360PortfolioBriefDocument content={brief} summary={summary} />
          </>
        ) : (
          <p className="text-13 leading-relaxed text-tertiary">
            {t("boards.client_360.intelligence_weekly_briefing_empty")}
          </p>
        )}
      </div>
    </Client360Section>
  );
}
