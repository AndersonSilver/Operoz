import { useCallback, useState } from "react";
import { FileText } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { TextArea } from "@operis/ui";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import { Client360Section } from "@/components/board/client-360/client-360-ui";
import { WorkspaceService } from "@/services/workspace.service";

const workspaceService = new WorkspaceService();

type Props = {
  workspaceSlug: string;
  projectId: string;
  period: { start: string; end: string };
  quarter?: string;
};

export function Client360QbrDraftBody({ workspaceSlug, projectId, period, quarter }: Props) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState("");
  const [humanEdit, setHumanEdit] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const generate = useCallback(async () => {
    setGenerating(true);
    try {
      const row = await workspaceService.generateClient360QbrDraft(workspaceSlug, projectId, {
        period_start: period.start,
        period_end: period.end,
        quarter,
      });
      setDraft(row.content_md || "");
      setHumanEdit(row.human_edited_md || row.effective_md || row.content_md || "");
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: t("issue_modal_ai_error_generic") });
    } finally {
      setGenerating(false);
    }
  }, [period.end, period.start, projectId, quarter, t, workspaceSlug]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await workspaceService.updateClient360QbrDraft(workspaceSlug, projectId, {
        human_edited_md: humanEdit,
        quarter,
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.client_360.intelligence_qbr_saved"),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: t("issue_modal_ai_error_generic") });
    } finally {
      setSaving(false);
    }
  }, [humanEdit, projectId, quarter, t, workspaceSlug]);

  return (
    <div className="space-y-3">
      <Button variant="primary" size="sm" loading={generating} onClick={() => void generate()}>
        {draft ? t("boards.client_360.ai_regenerate") : t("boards.client_360.intelligence_qbr_generate")}
      </Button>
      {humanEdit || draft ? (
        <TextArea
          value={humanEdit || draft}
          onChange={(event) => setHumanEdit(event.target.value)}
          rows={16}
          className="font-mono text-12"
        />
      ) : (
        <p className="text-12 text-tertiary">{t("boards.client_360.intelligence_qbr_empty")}</p>
      )}
      {humanEdit || draft ? (
        <div className="flex justify-end">
          <Button size="sm" loading={saving} onClick={() => void save()}>
            {t("common.save")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function Client360QbrDraftSection(props: Props) {
  const { t } = useTranslation();

  return (
    <Client360Section
      sectionId="qbr-draft"
      icon={FileText}
      iconTone="accent"
      title={t("boards.client_360.intelligence_qbr_draft_title")}
      description={t("boards.client_360.intelligence_qbr_draft_subtitle")}
    >
      <Client360QbrDraftBody {...props} />
    </Client360Section>
  );
}
