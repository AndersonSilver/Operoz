import { useCallback, useState } from "react";
import { HeartPulse } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { Client360Section } from "@/components/board/client-360/client-360-ui";
import { WorkspaceService } from "@/services/workspace.service";

const workspaceService = new WorkspaceService();

type Props = {
  workspaceSlug: string;
  projectId: string;
  period: { start: string; end: string };
};

export function Client360HealthExplainerBody({ workspaceSlug, projectId, period }: Props) {
  const { t } = useTranslation();
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const explain = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await workspaceService.getClient360HealthExplainer(workspaceSlug, projectId, {
        period_start: period.start,
        period_end: period.end,
      });
      setText(payload.explanation_md || payload.static_fallback_md || "");
    } catch {
      setText(t("boards.client_360.intelligence_explainer_fallback"));
    } finally {
      setLoading(false);
    }
  }, [period.end, period.start, projectId, t, workspaceSlug]);

  return (
    <div className="space-y-3">
      <Button variant="primary" size="sm" loading={loading} onClick={() => void explain()}>
        {t("boards.client_360.intelligence_explainer_action")}
      </Button>
      <div className="rounded-xl border border-subtle bg-layer-2/30 px-4 py-4">
        {text ? (
          <p className="text-13 leading-relaxed whitespace-pre-wrap text-secondary">{text}</p>
        ) : (
          <p className="text-12 text-tertiary">{t("boards.client_360.intelligence_explainer_empty")}</p>
        )}
        {text ? (
          <p className="mt-2 text-11 text-tertiary">{t("boards.client_360.intelligence_explainer_disclaimer")}</p>
        ) : null}
      </div>
    </div>
  );
}

export function Client360HealthExplainer(props: Props) {
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
