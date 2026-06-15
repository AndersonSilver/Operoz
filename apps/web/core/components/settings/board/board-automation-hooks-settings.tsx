import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@operis/i18n";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { IBoard, IBoardAutomationHook } from "@operis/types";
import { Loader } from "@operis/ui";
import { BoardService } from "@/services/board/board.service";
import { AutomationHooksPanel, type HookFormValues, parseConfig } from "./automation/automation-hooks-panel";

const boardService = new BoardService();

export const BoardAutomationHooksSettings = observer(function BoardAutomationHooksSettings(props: {
  workspaceSlug: string;
  board: IBoard;
}) {
  const { workspaceSlug, board } = props;
  const { t } = useTranslation();
  const [hooks, setHooks] = useState<IBoardAutomationHook[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const data = await boardService.getAutomationHooks(workspaceSlug, board.slug);
    setHooks(data);
  }, [workspaceSlug, board.slug]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load()
      .catch(() => {
        if (cancelled) return;
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: t("something_went_wrong"),
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceSlug, board.slug]);

  const handleCreate = async (values: HookFormValues) => {
    setSaving(true);
    try {
      const created = await boardService.createAutomationHook(workspaceSlug, board.slug, {
        name: values.name,
        enabled: values.enabled,
        event: values.event,
        matcher: values.matcher,
        handler_type: values.handler_type,
        config: parseConfig(values.config_json),
      });
      setHooks((prev) => [created, ...prev]);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.settings.automation.hooks.create_success"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("something_went_wrong"),
      });
      throw new Error("create failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (hookId: string) => {
    setSaving(true);
    try {
      await boardService.deleteAutomationHook(workspaceSlug, board.slug, hookId);
      setHooks((prev) => prev.filter((item) => item.id !== hookId));
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.settings.automation.hooks.delete_success"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("something_went_wrong"),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-2 text-13 text-tertiary">
        <Loader />
        {t("loading")}
      </div>
    );
  }

  return <AutomationHooksPanel hooks={hooks} saving={saving} onCreate={handleCreate} onDelete={handleDelete} />;
});
