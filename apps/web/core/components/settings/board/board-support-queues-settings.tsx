"use client";

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Headphones, Layers3, Trash2, Users } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { IBoard, TBoardSupportQueue } from "@operoz/types";
import { Input, Loader, TextArea, ToggleSwitch } from "@operoz/ui";
import { cn } from "@operoz/utils";
import { boardSupportQueueService } from "@/services/board/board-support-queue.service";
import { SupportSettingsHero } from "@/components/settings/board/support/support-settings-hero";

const QUEUE_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#64748b"];

const FIELD_SHELL =
  "rounded-lg border border-subtle bg-surface-1 px-3 shadow-xs transition-colors focus-within:border-accent-strong focus-within:ring-2 focus-within:ring-accent-primary/15";

type QueueFormState = {
  name: string;
  description: string;
  color: string;
  sort_order: number;
  is_default: boolean;
};

const emptyForm = (): QueueFormState => ({
  name: "",
  description: "",
  color: QUEUE_COLORS[0],
  sort_order: 0,
  is_default: false,
});

function formFromQueue(queue: TBoardSupportQueue): QueueFormState {
  return {
    name: queue.name,
    description: queue.description ?? "",
    color: queue.color || QUEUE_COLORS[0],
    sort_order: queue.sort_order ?? 0,
    is_default: queue.is_default,
  };
}

export const BoardSupportQueuesSettings = observer(function BoardSupportQueuesSettings(props: {
  workspaceSlug: string;
  board: IBoard;
}) {
  const { workspaceSlug, board } = props;
  const { t } = useTranslation();
  const [queues, setQueues] = useState<TBoardSupportQueue[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<QueueFormState>(emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selected = queues.find((item) => item.id === selectedId) ?? null;

  const load = useCallback(async () => {
    const data = await boardSupportQueueService.list(workspaceSlug, board.slug);
    setQueues(data);
    if (data.length) {
      setSelectedId((current) => {
        const next = data.find((item) => item.id === current) ?? data[0];
        setForm(formFromQueue(next));
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
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: t("boards.settings.support_queues.load_error"),
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const created = await boardSupportQueueService.create(workspaceSlug, board.slug, {
        name: t("boards.settings.support_queues.default_name"),
        color: QUEUE_COLORS[0],
        sort_order: queues.length,
      });
      setQueues((prev) => [...prev, created]);
      setSelectedId(created.id);
      setForm(formFromQueue(created));
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.settings.support_queues.created"),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!selected) return;
    if (!form.name.trim()) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("boards.settings.support_queues.name_required"),
      });
      return;
    }
    setSaving(true);
    try {
      const updated = await boardSupportQueueService.update(workspaceSlug, board.slug, selected.id, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        color: form.color,
        sort_order: form.sort_order,
        is_default: form.is_default,
      });
      setQueues((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setForm(formFromQueue(updated));
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.settings.support_queues.saved"),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected || selected.is_default) return;
    if (!window.confirm(t("boards.settings.support_queues.delete_confirm"))) return;
    setSaving(true);
    try {
      await boardSupportQueueService.destroy(workspaceSlug, board.slug, selected.id);
      const remaining = queues.filter((item) => item.id !== selected.id);
      setQueues(remaining);
      if (remaining.length) {
        setSelectedId(remaining[0].id);
        setForm(formFromQueue(remaining[0]));
      } else {
        setSelectedId(null);
        setForm(emptyForm());
      }
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.settings.support_queues.deleted"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("boards.settings.support_queues.delete_error"),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader className="w-full max-w-xs">
          <Loader.Item height="32px" width="100%" />
        </Loader>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SupportSettingsHero
        icon={Headphones}
        title={t("boards.settings.support_queues.title")}
        description={t("boards.settings.support_queues.subtitle")}
        createLabel={t("boards.settings.support_queues.create")}
        creating={saving}
        onCreate={() => void handleCreate()}
        highlights={[
          { label: t("boards.settings.support_queues.highlight_routing"), icon: Layers3, tone: "accent" },
          { label: t("boards.settings.support_queues.highlight_teams"), icon: Users, tone: "purple" },
        ]}
        gradientClass="from-[var(--extended-color-purple-500)]/10"
        accentClass="border border-subtle bg-[var(--extended-color-purple-500)]/10 text-[var(--extended-color-purple-500)]"
      />

      {queues.length === 0 ? (
        <div className="rounded-xl border border-dashed border-subtle bg-layer-1 px-6 py-12 text-center text-13 text-secondary">
          {t("boards.settings.support_queues.empty")}
        </div>
      ) : (
        <div className="shadow-xs grid gap-5 overflow-hidden rounded-xl border border-subtle bg-layer-1 lg:grid-cols-[240px_1fr]">
          <aside className="border-b border-subtle bg-layer-2/30 p-3 lg:border-r lg:border-b-0">
            <p className="mb-2 px-2 text-11 font-semibold tracking-wide text-tertiary uppercase">
              {t("boards.settings.support_queues.list_title")}
            </p>
            <ul className="space-y-1">
              {queues.map((queue) => (
                <li key={queue.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(queue.id);
                      setForm(formFromQueue(queue));
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-13 transition-colors",
                      selectedId === queue.id
                        ? "shadow-xs bg-surface-1 font-medium text-primary ring-1 ring-subtle"
                        : "text-secondary hover:bg-layer-1/80"
                    )}
                  >
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: queue.color }} />
                    <span className="min-w-0 flex-1 truncate">{queue.name}</span>
                    {queue.is_default ? (
                      <span className="shrink-0 rounded-full bg-layer-2 px-1.5 py-0.5 text-10 font-medium text-tertiary">
                        {t("boards.settings.support_queues.default_badge")}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {selected ? (
            <div className="flex min-h-[20rem] flex-col p-5">
              <div className="grid flex-1 gap-5">
                <label className="block space-y-2">
                  <span className="text-11 font-medium tracking-wide text-tertiary uppercase">
                    {t("boards.settings.support_queues.name_label")}
                  </span>
                  <div className={FIELD_SHELL}>
                    <Input
                      className="h-10 border-0 bg-transparent shadow-none focus:ring-0"
                      value={form.name}
                      onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    />
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-11 font-medium tracking-wide text-tertiary uppercase">
                    {t("boards.settings.support_queues.description_label")}
                  </span>
                  <div className={FIELD_SHELL}>
                    <TextArea
                      className="min-h-[88px] border-0 bg-transparent shadow-none focus:ring-0"
                      value={form.description}
                      onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                      rows={3}
                    />
                  </div>
                </label>

                <div className="space-y-2">
                  <span className="text-11 font-medium tracking-wide text-tertiary uppercase">
                    {t("boards.settings.support_queues.color_label")}
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {QUEUE_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        aria-label={color}
                        onClick={() => setForm((current) => ({ ...current, color }))}
                        className={cn(
                          "size-8 rounded-full border-2 transition-transform hover:scale-105",
                          form.color === color ? "border-primary shadow-sm scale-110" : "border-transparent"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-lg border border-subtle bg-layer-2/30 px-4 py-3">
                  <div>
                    <p className="text-13 font-medium text-primary">
                      {t("boards.settings.support_queues.default_label")}
                    </p>
                    <p className="mt-0.5 text-12 text-tertiary">{t("boards.settings.support_queues.default_hint")}</p>
                  </div>
                  <ToggleSwitch
                    value={form.is_default}
                    onChange={(value) => setForm((current) => ({ ...current, is_default: value }))}
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5 border-t border-subtle/80 pt-4">
                {!selected.is_default ? (
                  <Button
                    variant="error-outline"
                    size="sm"
                    className="mr-auto h-9"
                    onClick={() => void handleDelete()}
                    disabled={saving}
                  >
                    <Trash2 className="size-3.5" />
                    {t("common.delete")}
                  </Button>
                ) : null}
                <Button
                  variant="primary"
                  size="sm"
                  className="h-9 min-w-[5.5rem]"
                  onClick={() => void handleSave()}
                  loading={saving}
                >
                  {t("common.save")}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
});
