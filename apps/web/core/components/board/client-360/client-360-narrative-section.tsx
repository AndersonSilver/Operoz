import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import { BookOpen } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import { Button } from "@operis/propel/button";
import { Loader } from "@operis/ui";
import type { TClient360Narrative } from "@operis/types";
import { Client360Section } from "@/components/board/client-360/client-360-ui";
import { CLIENT_360_SWR_CONFIG } from "@/components/board/client-360/client-360-utils";
import { WorkspaceService } from "@/services/workspace.service";

const workspaceService = new WorkspaceService();

type Props = {
  workspaceSlug: string;
  projectId: string;
  period: { start: string; end: string };
  readOnly?: boolean;
};

type FieldKey = "wins_md" | "risks_md" | "next_steps_md";

const FIELD_KEYS: FieldKey[] = ["wins_md", "risks_md", "next_steps_md"];

function emptyNarrative(): TClient360Narrative {
  return { wins_md: "", risks_md: "", next_steps_md: "", updated_at: null };
}

export function Client360NarrativeSection({ workspaceSlug, projectId, period, readOnly = false }: Props) {
  const { t } = useTranslation();
  const { data, isLoading, mutate } = useSWR(
    workspaceSlug && projectId ? `CLIENT_360_NARRATIVE_${workspaceSlug}_${projectId}_${period.start}` : null,
    () =>
      workspaceService.getClient360Narrative(workspaceSlug, projectId, {
        period_start: period.start,
        period_end: period.end,
      }),
    CLIENT_360_SWR_CONFIG
  );

  const [draft, setDraft] = useState<TClient360Narrative>(emptyNarrative());
  const [baseline, setBaseline] = useState<TClient360Narrative>(emptyNarrative());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const snapshot = data ?? emptyNarrative();
    setDraft(snapshot);
    setBaseline(snapshot);
  }, [data, period.start]);

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(baseline);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const updated = await workspaceService.updateClient360Narrative(
        workspaceSlug,
        projectId,
        {
          wins_md: draft.wins_md,
          risks_md: draft.risks_md,
          next_steps_md: draft.next_steps_md,
        },
        { period_start: period.start, period_end: period.end }
      );
      setDraft(updated);
      setBaseline(updated);
      void mutate(updated, { revalidate: false });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.client_360.narrative_save_success"),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setSaving(false);
    }
  }, [draft, mutate, period.end, period.start, projectId, t, workspaceSlug]);

  return (
    <Client360Section
      sectionId="narrative"
      icon={BookOpen}
      iconTone="info"
      title={t("boards.client_360.narrative_title")}
      description={t("boards.client_360.narrative_subtitle")}
      action={
        !readOnly && hasChanges ? (
          <Button variant="primary" size="sm" loading={saving} onClick={() => void handleSave()}>
            {t("boards.client_360.narrative_save")}
          </Button>
        ) : null
      }
    >
      {isLoading && !data ? (
        <div className="flex min-h-[120px] items-center justify-center">
          <Loader />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {FIELD_KEYS.map((key) => (
            <label key={key} className="block text-12 text-secondary">
              {t(`boards.client_360.narrative_${key}`)}
              <textarea
                className="mt-1.5 min-h-[120px] w-full resize-y rounded-md border border-subtle bg-layer-2 px-3 py-2 text-13 text-primary placeholder:text-tertiary focus:border-strong focus:outline-none"
                value={draft[key]}
                readOnly={readOnly}
                placeholder={t(`boards.client_360.narrative_${key}_placeholder`)}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              />
            </label>
          ))}
        </div>
      )}
    </Client360Section>
  );
}
