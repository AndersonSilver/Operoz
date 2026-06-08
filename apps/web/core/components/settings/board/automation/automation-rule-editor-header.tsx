import { ArrowLeft, Clock3, History, Play, Rocket, Save, Workflow } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { Switch } from "@operis/propel/switch";
import { cn } from "@operis/ui";
import type { IBoardAutomationRule } from "@operis/types";
import { ConfigField, ConfigTextInput } from "./automation-config-primitives";
import {
  automationHasLocalDraftChanges,
} from "./automation-publication";
import "./automation-list.css";

type Props = {
  rule: IBoardAutomationRule;
  name: string;
  description: string;
  enabled: boolean;
  graph: IBoardAutomationRule["graph"];
  saving: boolean;
  publishing: boolean;
  historyHref: string;
  onBack: () => void;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onEnabledChange: (value: boolean) => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  onOpenRevisions: () => void;
  onTest: () => void;
};

export function AutomationRuleEditorHeader(props: Props) {
  const {
    rule,
    name,
    description,
    enabled,
    graph,
    saving,
    publishing,
    historyHref,
    onBack,
    onNameChange,
    onDescriptionChange,
    onEnabledChange,
    onSaveDraft,
    onPublish,
    onOpenRevisions,
    onTest,
  } = props;
  const { t } = useTranslation();
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  const hasLocalChanges = automationHasLocalDraftChanges(rule, { name, description, graph });
  const canEnable = rule.is_published;
  const canPublish = !publishing && !saving;

  return (
    <header className="shrink-0 overflow-hidden rounded-xl border border-subtle bg-layer-1">
      <div className="automation-hero-dot-grid relative border-b border-subtle bg-gradient-to-br from-accent-subtle/25 via-transparent to-transparent px-4 py-3">
        <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} prependIcon={<ArrowLeft />}>
              {t("boards.settings.automation.back_to_list")}
            </Button>
            <span className="hidden h-5 w-px bg-subtle sm:block" aria-hidden />
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-subtle bg-accent-subtle/60 text-accent-primary">
                <Workflow className="size-4" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-14 font-semibold text-primary">
                    {name.trim() || t("boards.settings.automation.new_rule_name")}
                  </p>
                  {hasLocalChanges && (
                    <span className="inline-flex shrink-0 rounded-full bg-accent-subtle/70 px-2 py-0.5 text-10 font-medium text-accent-primary">
                      {t("boards.settings.automation.editor.unsaved_changes")}
                    </span>
                  )}
                </div>
                {rule.published_at && (
                  <p className="mt-0.5 text-10 text-placeholder">
                    {t("boards.settings.automation.editor.published_at", {
                      date: new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
                        new Date(rule.published_at)
                      ),
                    })}
                    {rule.published_version > 0 ? ` · v${rule.published_version}` : ""}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <div className="automation-editor-toolbar">
              <label
                className={cn(
                  "automation-editor-toolbar-toggle",
                  canEnable ? "cursor-pointer" : "cursor-not-allowed opacity-60",
                  enabled && canEnable && "is-active"
                )}
                title={!canEnable ? t("boards.settings.automation.editor.enable_requires_publish") : undefined}
              >
                <Switch
                  value={enabled && canEnable}
                  onChange={(value) => {
                    if (!canEnable) return;
                    onEnabledChange(value);
                  }}
                  size="sm"
                  disabled={!canEnable || saving || publishing}
                />
                <span>{t("boards.settings.automation.enabled")}</span>
              </label>

              <span className="automation-editor-toolbar-divider" aria-hidden />

              <button type="button" className="automation-editor-toolbar-action is-accent" onClick={onTest}>
                <Play className="size-3.5 shrink-0" strokeWidth={1.75} />
                {t("boards.settings.automation.dry_run")}
              </button>

              <Link to={historyHref} className="automation-editor-toolbar-action">
                <History className="size-3.5 shrink-0" strokeWidth={1.75} />
                {t("boards.settings.nav.automation_event_history")}
              </Link>

              <button type="button" className="automation-editor-toolbar-action" onClick={onOpenRevisions}>
                <Clock3 className="size-3.5 shrink-0" strokeWidth={1.75} />
                {t("boards.settings.automation.editor.revision_history")}
              </button>
            </div>

            <Button
              variant="secondary"
              size="sm"
              className="automation-editor-save-draft"
              onClick={onSaveDraft}
              loading={saving}
              disabled={publishing}
              prependIcon={<Save className="size-3.5" strokeWidth={1.75} />}
            >
              {t("boards.settings.automation.editor.save_draft")}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className="automation-editor-publish"
              onClick={() => setShowPublishConfirm(true)}
              loading={publishing}
              disabled={!canPublish}
              prependIcon={<Rocket className="size-3.5" strokeWidth={1.75} />}
            >
              {t("boards.settings.automation.editor.publish")}
            </Button>
          </div>
        </div>
      </div>

      {showPublishConfirm && (
        <div className="border-b border-subtle bg-surface-2/80 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-13 font-medium text-primary">
                {t("boards.settings.automation.editor.publish_confirm_title")}
              </p>
              <p className="mt-0.5 text-11 leading-relaxed text-tertiary">
                {t("boards.settings.automation.editor.publish_confirm_body")}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowPublishConfirm(false)}>
                {t("cancel")}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="automation-editor-publish"
                loading={publishing}
                prependIcon={<Rocket className="size-3.5" strokeWidth={1.75} />}
                onClick={() => {
                  setShowPublishConfirm(false);
                  onPublish();
                }}
              >
                {t("boards.settings.automation.editor.publish")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 p-4 md:grid-cols-2">
        <ConfigField label={t("name")}>
          <ConfigTextInput value={name} onChange={onNameChange} />
        </ConfigField>
        <ConfigField label={t("description")}>
          <ConfigTextInput value={description} onChange={onDescriptionChange} />
        </ConfigField>
      </div>
    </header>
  );
}
