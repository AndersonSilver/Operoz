import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Mail, Trash2 } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { Switch } from "@operoz/propel/switch";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { IBoard, IBoardAutomationEmailTemplate } from "@operoz/types";
import { cn } from "@operoz/ui";
import { BoardService } from "@/services/board/board.service";
import { AutomationEmailPreview } from "./automation-email-preview";
import { AutomationCodeField } from "./automation-code-field";
import { ConfigField, ConfigTextInput } from "./automation-config-primitives";

const boardService = new BoardService();

type Props = {
  workspaceSlug: string;
  board: IBoard;
  template: IBoardAutomationEmailTemplate;
  onBack: () => void;
  onSaved: (template: IBoardAutomationEmailTemplate) => void;
  onDeleted: () => void;
};

export const BoardAutomationEmailEditor = observer(function BoardAutomationEmailEditor(props: Props) {
  const { workspaceSlug, board, template, onBack, onSaved, onDeleted } = props;
  const { t } = useTranslation();
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description ?? "");
  const [subject, setSubject] = useState(template.subject);
  const [htmlBody, setHtmlBody] = useState(template.html_body);
  const [isActive, setIsActive] = useState(template.is_active);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setName(template.name);
    setDescription(template.description ?? "");
    setSubject(template.subject);
    setHtmlBody(template.html_body);
    setIsActive(template.is_active);
  }, [template.id, template.name, template.description, template.subject, template.html_body, template.is_active]);

  const handleNameChange = (nextName: string) => {
    setName(nextName);
    const defaultSubject = t("boards.settings.automation.emails.default_subject");
    const newTemplateName = t("boards.settings.automation.emails.new_name");
    if (subject === defaultSubject && nextName.trim() && nextName !== newTemplateName) {
      setSubject(nextName.trim());
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await boardService.updateAutomationEmailTemplate(workspaceSlug, board.slug, template.id, {
        name,
        description,
        subject,
        html_body: htmlBody,
        is_active: isActive,
      });
      onSaved(updated);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.settings.automation.emails.save_success"),
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
      await boardService.deleteAutomationEmailTemplate(workspaceSlug, board.slug, template.id);
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
            {t("boards.settings.automation.emails.active")}
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
        <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-subtle bg-success-subtle text-success-primary">
          <Mail className="size-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-16 font-semibold text-primary">{name || template.name}</h1>
          <p className="mt-0.5 text-13 text-tertiary">{t("boards.settings.automation.emails.editor_lead")}</p>
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
          <ConfigField label={t("name")} hint={t("boards.settings.automation.emails.name_hint")}>
            <ConfigTextInput value={name} onChange={handleNameChange} />
          </ConfigField>
          <ConfigField label={t("description")}>
            <ConfigTextInput value={description} onChange={setDescription} />
          </ConfigField>
        </div>
        <div className="mt-4">
          <ConfigField
            label={t("boards.settings.automation.emails.subject")}
            hint={t("boards.settings.automation.emails.subject_hint")}
          >
            <ConfigTextInput value={subject} onChange={setSubject} />
          </ConfigField>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-subtle bg-layer-1 p-4 lg:p-5">
          <AutomationCodeField
            label={t("boards.settings.automation.emails.html")}
            hint={t("boards.settings.automation.emails.html_hint")}
            value={htmlBody}
            onChange={setHtmlBody}
            language="html"
            minHeight="520px"
          />
        </div>
        <div className="rounded-xl border border-subtle bg-layer-1 p-4 lg:p-5">
          <AutomationEmailPreview subject={subject} htmlBody={htmlBody} />
        </div>
      </div>
    </div>
  );
});
