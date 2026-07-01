import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Code2, Trash2 } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { Switch } from "@operoz/propel/switch";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { IBoard, IBoardAutomationScript } from "@operoz/types";
import { cn } from "@operoz/ui";
import { BoardService } from "@/services/board/board.service";
import { AutomationCodeField } from "./automation-code-field";
import { ConfigField, ConfigTextInput } from "./automation-config-primitives";

const boardService = new BoardService();

type Props = {
  workspaceSlug: string;
  board: IBoard;
  script: IBoardAutomationScript;
  onBack: () => void;
  onSaved: (script: IBoardAutomationScript) => void;
  onDeleted: () => void;
};

export const BoardAutomationScriptEditor = observer(function BoardAutomationScriptEditor(props: Props) {
  const { workspaceSlug, board, script, onBack, onSaved, onDeleted } = props;
  const { t } = useTranslation();
  const [name, setName] = useState(script.name);
  const [description, setDescription] = useState(script.description ?? "");
  const [sourceCode, setSourceCode] = useState(script.source_code);
  const [isActive, setIsActive] = useState(script.is_active);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setName(script.name);
    setDescription(script.description ?? "");
    setSourceCode(script.source_code);
    setIsActive(script.is_active);
  }, [script.id, script.name, script.description, script.source_code, script.is_active]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await boardService.updateAutomationScript(workspaceSlug, board.slug, script.id, {
        name,
        description,
        source_code: sourceCode,
        is_active: isActive,
      });
      onSaved(updated);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.settings.automation.scripts.save_success"),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await boardService.deleteAutomationScript(workspaceSlug, board.slug, script.id);
      onDeleted();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2 border-b border-subtle pb-4">
        <button type="button" className="text-13 font-medium text-accent-primary hover:underline" onClick={onBack}>
          ← {t("boards.settings.automation.back_to_list")}
        </button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-subtle bg-layer-1 px-2.5 py-1.5 text-12 text-secondary">
            <Switch value={isActive} onChange={setIsActive} size="sm" />
            {t("boards.settings.automation.scripts.active")}
          </label>
          <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
            {t("save")}
          </Button>
          <Button variant="error-outline" size="sm" onClick={handleDelete} loading={deleting} prependIcon={<Trash2 />}>
            {t("delete")}
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-subtle bg-accent-subtle text-accent-primary">
          <Code2 className="size-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-16 font-semibold text-primary">{name || script.name}</h1>
          <p className="mt-0.5 text-13 text-tertiary">{t("boards.settings.automation.scripts.editor_lead")}</p>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-10 font-semibold tracking-wide uppercase",
            isActive ? "bg-success-subtle text-success-primary" : "bg-layer-2 text-tertiary"
          )}
        >
          {isActive
            ? t("boards.settings.automation.rules_list.status_active")
            : t("boards.settings.automation.rules_list.status_inactive")}
        </span>
      </div>

      <div className="rounded-xl border border-subtle bg-layer-1 p-4 lg:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <ConfigField label={t("name")}>
            <ConfigTextInput value={name} onChange={setName} />
          </ConfigField>
          <ConfigField label={t("description")}>
            <ConfigTextInput value={description} onChange={setDescription} />
          </ConfigField>
        </div>
      </div>

      <div className="rounded-xl border border-subtle bg-layer-1 p-4 lg:p-5">
        <AutomationCodeField
          label={t("boards.settings.automation.scripts.code")}
          hint={t("boards.settings.automation.scripts.code_hint")}
          value={sourceCode}
          onChange={setSourceCode}
        />
      </div>
    </div>
  );
});
