import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@operoz/i18n";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { IBoard, IBoardPlaybook } from "@operoz/types";
import { Button } from "@operoz/propel/button";
import { Loader, TextArea } from "@operoz/ui";
import { BoardService } from "@/services/board/board.service";

const boardService = new BoardService();

type PlaybookFormState = {
  title: string;
  description: string;
  draft_markdown: string;
  intents_text: string;
};

const emptyForm = (): PlaybookFormState => ({
  title: "",
  description: "",
  draft_markdown: "## SLA\n\nDescreva regras de sustentação.\n",
  intents_text: "documentation, automation",
});

function formFromPlaybook(playbook: IBoardPlaybook): PlaybookFormState {
  return {
    title: playbook.title,
    description: playbook.description,
    draft_markdown: playbook.draft_markdown,
    intents_text: (playbook.metadata?.intents || []).join(", "),
  };
}

export const BoardPlaybooksSettings = observer(function BoardPlaybooksSettings(props: {
  workspaceSlug: string;
  board: IBoard;
}) {
  const { workspaceSlug, board } = props;
  const { t } = useTranslation();
  const [playbooks, setPlaybooks] = useState<IBoardPlaybook[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<PlaybookFormState>(emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selected = playbooks.find((item) => item.id === selectedId) ?? null;

  const load = useCallback(async () => {
    const data = await boardService.getPlaybooks(workspaceSlug, board.slug);
    setPlaybooks(data);
    if (data.length) {
      setSelectedId((current) => {
        const next = data.find((item) => item.id === current) ?? data[0];
        setForm(formFromPlaybook(next));
        return next.id;
      });
    }
  }, [workspaceSlug, board.slug]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load()
      .catch(() => {
        if (!cancelled) {
          setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceSlug, board.slug]);

  const parseIntents = (text: string) =>
    text
      .split(/,|\n/)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const created = await boardService.createPlaybook(workspaceSlug, board.slug, {
        title: t("boards.settings.playbooks.default_title"),
        draft_markdown: emptyForm().draft_markdown,
        metadata: { intents: ["documentation", "automation"] },
      });
      setPlaybooks((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setForm(formFromPlaybook(created));
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.settings.playbooks.create_success"),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await boardService.updatePlaybook(workspaceSlug, board.slug, selected.id, {
        title: form.title,
        description: form.description,
        draft_markdown: form.draft_markdown,
        metadata: { ...selected.metadata, intents: parseIntents(form.intents_text) },
      });
      setPlaybooks((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.settings.playbooks.save_success"),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const published = await boardService.publishPlaybook(workspaceSlug, board.slug, selected.id);
      setPlaybooks((prev) => prev.map((item) => (item.id === published.id ? published : item)));
      setForm(formFromPlaybook(published));
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.settings.playbooks.publish_success"),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await boardService.deletePlaybook(workspaceSlug, board.slug, selected.id);
      const remaining = playbooks.filter((item) => item.id !== selected.id);
      setPlaybooks(remaining);
      const next = remaining[0] ?? null;
      setSelectedId(next?.id ?? null);
      setForm(next ? formFromPlaybook(next) : emptyForm());
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.settings.playbooks.delete_success"),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-2 text-13 text-tertiary">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-16 font-semibold text-primary">{t("boards.settings.playbooks.title")}</h3>
        <p className="mt-1 text-13 text-tertiary">{t("boards.settings.playbooks.subtitle")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" size="sm" onClick={handleCreate} disabled={saving}>
          {t("boards.settings.playbooks.create_button")}
        </Button>
        {playbooks.map((item) => (
          <Button
            key={item.id}
            variant={item.id === selectedId ? "primary" : "primary"}
            size="sm"
            onClick={() => {
              setSelectedId(item.id);
              setForm(formFromPlaybook(item));
            }}
          >
            {item.title}
            {item.has_unpublished_changes ? " *" : ""}
          </Button>
        ))}
      </div>

      {selected ? (
        <div className="flex flex-col gap-4 rounded-lg border border-subtle bg-surface-1 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-13">
              <span className="font-medium text-secondary">{t("boards.settings.playbooks.field_title")}</span>
              <input
                className="rounded border border-subtle bg-surface-2 px-3 py-2 text-13"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </label>
            <label className="flex flex-col gap-1 text-13">
              <span className="font-medium text-secondary">{t("boards.settings.playbooks.field_intents")}</span>
              <input
                className="rounded border border-subtle bg-surface-2 px-3 py-2 text-13"
                value={form.intents_text}
                onChange={(event) => setForm((prev) => ({ ...prev, intents_text: event.target.value }))}
                placeholder="documentation, metrics, automation"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-13">
            <span className="font-medium text-secondary">{t("boards.settings.playbooks.field_description")}</span>
            <input
              className="rounded border border-subtle bg-surface-2 px-3 py-2 text-13"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </label>

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="flex flex-col gap-1 text-13">
              <span className="font-medium text-secondary">{t("boards.settings.playbooks.field_markdown")}</span>
              <TextArea
                value={form.draft_markdown}
                onChange={(event) => setForm((prev) => ({ ...prev, draft_markdown: event.target.value }))}
                textAreaSize="md"
                className="font-mono min-h-[320px]"
              />
            </label>
            <div className="flex flex-col gap-1 text-13">
              <span className="font-medium text-secondary">{t("boards.settings.playbooks.preview_title")}</span>
              <div className="min-h-[320px] overflow-auto rounded border border-subtle bg-surface-2 p-3 text-13 whitespace-pre-wrap">
                {form.draft_markdown || t("boards.settings.playbooks.preview_empty")}
              </div>
              <p className="text-12 text-tertiary">
                {t("boards.settings.playbooks.version_label", { version: selected.published_version })}
                {selected.has_unpublished_changes ? ` — ${t("boards.settings.playbooks.unpublished_changes")}` : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
              {t("save")}
            </Button>
            <Button variant="primary" size="sm" onClick={handlePublish} disabled={saving}>
              {t("boards.settings.playbooks.publish_button")}
            </Button>
            <Button variant="error-outline" size="sm" onClick={handleDelete} disabled={saving}>
              {t("boards.settings.playbooks.delete_button")}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-13 text-tertiary">{t("boards.settings.playbooks.empty")}</p>
      )}
    </div>
  );
});
