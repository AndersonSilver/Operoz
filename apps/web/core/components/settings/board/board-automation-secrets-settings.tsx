import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@operis/i18n";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { IBoard, IBoardAutomationSecret } from "@operis/types";
import { Loader } from "@operis/ui";
import { BoardService } from "@/services/board/board.service";
import type { SecretFormValues } from "./automation/automation-secret-form-modal";
import { AutomationSecretsPanel } from "./automation/automation-secrets-panel";

const boardService = new BoardService();

export const BoardAutomationSecretsSettings = observer(function BoardAutomationSecretsSettings(props: {
  workspaceSlug: string;
  board: IBoard;
}) {
  const { workspaceSlug, board } = props;
  const { t } = useTranslation();
  const [secrets, setSecrets] = useState<IBoardAutomationSecret[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const data = await boardService.getAutomationSecrets(workspaceSlug, board.slug);
    setSecrets(data);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carregar só ao mudar board/workspace
  }, [workspaceSlug, board.slug]);

  const handleCreate = async (values: SecretFormValues) => {
    setSaving(true);
    try {
      const created = await boardService.createAutomationSecret(workspaceSlug, board.slug, values);
      setSecrets((prev) => [...prev, created].sort((a, b) => a.key.localeCompare(b.key)));
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.settings.automation.ops.secrets.create_success"),
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

  const handleUpdate = async (secretId: string, values: SecretFormValues) => {
    setSaving(true);
    try {
      const payload: { key: string; description: string; value?: string } = {
        key: values.key,
        description: values.description,
      };
      if (values.value) payload.value = values.value;
      const updated = await boardService.updateAutomationSecret(
        workspaceSlug,
        board.slug,
        secretId,
        payload
      );
      setSecrets((prev) => prev.map((item) => (item.id === secretId ? updated : item)));
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.settings.automation.ops.secrets.update_success"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("something_went_wrong"),
      });
      throw new Error("update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (secretId: string) => {
    setSaving(true);
    try {
      await boardService.deleteAutomationSecret(workspaceSlug, board.slug, secretId);
      setSecrets((prev) => prev.filter((item) => item.id !== secretId));
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.settings.automation.ops.secrets.delete_success"),
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

  return (
    <AutomationSecretsPanel
      secrets={secrets}
      saving={saving}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
});
