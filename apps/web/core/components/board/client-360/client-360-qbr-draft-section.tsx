"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import { Client360Section } from "@/components/board/client-360/client-360-ui";
import {
  Client360QbrDraftDocument,
  Client360QbrDraftEditActions,
  Client360QbrDraftEmptyState,
  Client360QbrDraftGenerateButton,
  serializeQbrEdits,
} from "@/components/board/client-360/client-360-qbr-draft-document";
import { parseClient360QbrDraftMarkdown } from "@/components/board/client-360/parse-client-360-qbr-draft";
import { WorkspaceService } from "@/services/workspace.service";

const workspaceService = new WorkspaceService();

type Props = {
  workspaceSlug: string;
  projectId: string;
  period: { start: string; end: string };
  quarter?: string;
  generateSignal?: number;
  onLoadingChange?: (loading: boolean) => void;
  onDraftChange?: (hasDraft: boolean) => void;
  panelMode?: boolean;
};

export function Client360QbrDraftBody({
  workspaceSlug,
  projectId,
  period,
  quarter,
  generateSignal = 0,
  onLoadingChange,
  onDraftChange,
  panelMode = false,
}: Props) {
  const { t } = useTranslation();
  const [sourceMd, setSourceMd] = useState("");
  const [humanEdit, setHumanEdit] = useState("");
  const [winsEdit, setWinsEdit] = useState("");
  const [risksEdit, setRisksEdit] = useState("");
  const [editing, setEditing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const effectiveMd = (humanEdit || sourceMd).trim();

  const parsed = useMemo(() => parseClient360QbrDraftMarkdown(effectiveMd), [effectiveMd]);

  const loadDraft = useCallback(async () => {
    try {
      const row = await workspaceService.getClient360QbrDraft(workspaceSlug, projectId, {
        period_start: period.start,
        period_end: period.end,
        quarter,
      });
      const content = row.content_md || "";
      const human = row.human_edited_md || "";
      setSourceMd(content);
      setHumanEdit(human);
      const active = (human || content).trim();
      onDraftChange?.(Boolean(active));
      if (active) {
        const p = parseClient360QbrDraftMarkdown(human || content);
        if (p) {
          setWinsEdit(p.wins);
          setRisksEdit(p.risks);
        }
      }
    } catch {
      /* no draft yet */
    } finally {
      setLoaded(true);
    }
  }, [onDraftChange, period.end, period.start, projectId, quarter, workspaceSlug]);

  useEffect(() => {
    void loadDraft();
  }, [loadDraft]);

  const generate = useCallback(async () => {
    setGenerating(true);
    onLoadingChange?.(true);
    try {
      const row = await workspaceService.generateClient360QbrDraft(workspaceSlug, projectId, {
        period_start: period.start,
        period_end: period.end,
        quarter,
      });
      const content = row.content_md || "";
      setSourceMd(content);
      setHumanEdit(row.human_edited_md || "");
      const active = (row.human_edited_md || content).trim();
      onDraftChange?.(Boolean(active));
      const p = parseClient360QbrDraftMarkdown(row.human_edited_md || content);
      if (p) {
        setWinsEdit(p.wins);
        setRisksEdit(p.risks);
      }
      setEditing(false);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: t("issue_modal_ai_error_generic") });
    } finally {
      setGenerating(false);
      onLoadingChange?.(false);
    }
  }, [onDraftChange, onLoadingChange, period.end, period.start, projectId, quarter, t, workspaceSlug]);

  useEffect(() => {
    if (generateSignal > 0) void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generateSignal]);

  const dirty = useMemo(() => {
    if (!parsed) return false;
    return winsEdit.trim() !== parsed.wins.trim() || risksEdit.trim() !== parsed.risks.trim();
  }, [parsed, risksEdit, winsEdit]);

  const save = useCallback(async () => {
    if (!parsed) return;
    setSaving(true);
    try {
      const nextMd = serializeQbrEdits(parsed, winsEdit, risksEdit);
      const row = await workspaceService.updateClient360QbrDraft(workspaceSlug, projectId, {
        human_edited_md: nextMd,
        quarter,
      });
      setHumanEdit(row.human_edited_md || nextMd);
      setEditing(false);
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
  }, [parsed, projectId, quarter, risksEdit, t, winsEdit, workspaceSlug]);

  if (!loaded && panelMode) {
    return <p className="text-13 text-tertiary">{t("loading")}…</p>;
  }

  if (!parsed) {
    return <Client360QbrDraftEmptyState onGenerate={() => void generate()} generating={generating} />;
  }

  return (
    <div className="space-y-4">
      {!panelMode ? (
        <Client360QbrDraftGenerateButton
          hasDraft={Boolean(effectiveMd)}
          loading={generating}
          onClick={() => void generate()}
        />
      ) : null}

      <Client360QbrDraftDocument
        parsed={parsed}
        editing={editing}
        winsEdit={winsEdit}
        risksEdit={risksEdit}
        onWinsChange={setWinsEdit}
        onRisksChange={setRisksEdit}
      />

      <Client360QbrDraftEditActions
        editing={editing}
        saving={saving}
        dirty={dirty}
        onToggleEdit={() => setEditing((current) => !current)}
        onSave={() => void save()}
      />
    </div>
  );
}

export { Client360QbrDraftGenerateButton } from "@/components/board/client-360/client-360-qbr-draft-document";

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
