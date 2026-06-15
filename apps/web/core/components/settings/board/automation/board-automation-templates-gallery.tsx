import { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { LayoutTemplate, Mail, Clock, Inbox, AlertTriangle, UserX } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { IBoard, IBoardAutomationRule, TAutomationTemplate } from "@operis/types";
import { Button } from "@operis/propel/button";
import { Loader, TextArea } from "@operis/ui";
import { BoardService } from "@/services/board/board.service";
import { AutomationDryRunTimeline } from "./automation-dry-run-timeline";

const boardService = new BoardService();

const ICONS: Record<string, typeof Mail> = {
  mail: Mail,
  clock: Clock,
  inbox: Inbox,
  "alert-triangle": AlertTriangle,
  "user-x": UserX,
};

type WizardStep = "pick" | "configure" | "review";

function paramDefaults(template: TAutomationTemplate): Record<string, string> {
  const values: Record<string, string> = {};
  for (const param of template.parameters) {
    const value = param.default;
    if (value === undefined || value === null) {
      values[param.key] = "";
    } else if (Array.isArray(value)) {
      values[param.key] = value.join(", ");
    } else {
      values[param.key] = String(value);
    }
  }
  return values;
}

function parseParamValue(param: TAutomationTemplate["parameters"][number], raw: string): unknown {
  if (param.type === "integer") {
    const parsed = Number.parseInt(raw, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (param.type === "array") {
    return raw
      .split(/,|\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return raw;
}

export const BoardAutomationTemplatesGallery = observer(function BoardAutomationTemplatesGallery(props: {
  workspaceSlug: string;
  board: IBoard;
  onInstalled?: (rule: IBoardAutomationRule) => void;
}) {
  const { workspaceSlug, board, onInstalled } = props;
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<TAutomationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TAutomationTemplate | null>(null);
  const [step, setStep] = useState<WizardStep>("pick");
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<Record<string, unknown> | null>(null);
  const [installedRule, setInstalledRule] = useState<IBoardAutomationRule | null>(null);

  const load = useCallback(async () => {
    const data = await boardService.getAutomationTemplates(workspaceSlug, board.slug);
    setTemplates(data);
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
  }, [load]);

  const parametersPayload = useMemo(() => {
    if (!selected) return {};
    const payload: Record<string, unknown> = {};
    for (const param of selected.parameters) {
      payload[param.key] = parseParamValue(param, paramValues[param.key] ?? "");
    }
    return payload;
  }, [selected, paramValues]);

  const openTemplate = (template: TAutomationTemplate) => {
    setSelected(template);
    setParamValues(paramDefaults(template));
    setDryRunResult(null);
    setInstalledRule(null);
    setStep("configure");
  };

  const resetWizard = () => {
    setSelected(null);
    setStep("pick");
    setDryRunResult(null);
    setInstalledRule(null);
  };

  const handleDryRun = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const result = await boardService.installAutomationTemplate(workspaceSlug, board.slug, selected.id, {
        parameters: parametersPayload,
        dry_run: true,
        live: false,
      });
      setInstalledRule(result.rule);
      setDryRunResult((result.dry_run as Record<string, unknown>) ?? null);
      setStep("review");
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.settings.automation.templates.dry_run_success"),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setSaving(false);
    }
  };

  const handleInstall = async (publish: boolean) => {
    if (!selected) return;
    setSaving(true);
    try {
      let rule = installedRule;
      if (!rule) {
        const result = await boardService.installAutomationTemplate(workspaceSlug, board.slug, selected.id, {
          parameters: parametersPayload,
          publish: false,
          dry_run: false,
        });
        rule = result.rule;
      }
      if (publish && rule) {
        rule = await boardService.publishAutomationRule(workspaceSlug, board.slug, rule.id);
      }
      if (rule) onInstalled?.(rule);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: publish
          ? t("boards.settings.automation.templates.install_publish_success")
          : t("boards.settings.automation.templates.install_success"),
      });
      resetWizard();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (step === "pick") {
    return (
      <div className="space-y-4">
        <p className="text-13 text-tertiary">{t("boards.settings.automation.templates.subtitle")}</p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => {
            const Icon = ICONS[template.icon] ?? LayoutTemplate;
            return (
              <button
                key={template.id}
                type="button"
                className="hover:border-accent flex flex-col gap-2 rounded-lg border border-subtle bg-surface-1 p-4 text-left transition"
                onClick={() => openTemplate(template)}
              >
                <div className="flex items-center gap-2">
                  <Icon className="text-accent size-4" />
                  <span className="text-14 font-medium text-primary">{template.name}</span>
                </div>
                <p className="text-12 text-tertiary">{template.description}</p>
                <p className="text-quaternary text-11">
                  {template.preview.trigger_key} → {template.preview.action_keys.filter(Boolean).join(", ")}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (!selected) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-15 font-semibold text-primary">{selected.name}</h4>
          <p className="text-12 text-tertiary">{selected.description}</p>
        </div>
        <Button variant="neutral-primary" size="sm" onClick={resetWizard}>
          {t("boards.settings.automation.templates.back_to_gallery")}
        </Button>
      </div>

      {step === "configure" && (
        <div className="space-y-3 rounded-lg border border-subtle bg-surface-1 p-4">
          {selected.parameters.map((param) => (
            <label key={param.key} className="flex flex-col gap-1 text-13">
              <span className="font-medium text-secondary">
                {param.label}
                {param.required ? " *" : ""}
              </span>
              {param.type === "array" || param.key === "message" ? (
                <TextArea
                  value={paramValues[param.key] ?? ""}
                  onChange={(event) => setParamValues((prev) => ({ ...prev, [param.key]: event.target.value }))}
                  textareaSize="sm"
                />
              ) : (
                <input
                  className="rounded border border-subtle bg-surface-2 px-3 py-2 text-13"
                  value={paramValues[param.key] ?? ""}
                  onChange={(event) => setParamValues((prev) => ({ ...prev, [param.key]: event.target.value }))}
                />
              )}
            </label>
          ))}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="neutral-primary" size="sm" onClick={handleDryRun} disabled={saving}>
              {t("boards.settings.automation.templates.dry_run_button")}
            </Button>
            <Button variant="primary" size="sm" onClick={() => handleInstall(false)} disabled={saving}>
              {t("boards.settings.automation.templates.install_button")}
            </Button>
            <Button variant="primary" size="sm" onClick={() => handleInstall(true)} disabled={saving}>
              {t("boards.settings.automation.templates.install_publish_button")}
            </Button>
          </div>
        </div>
      )}

      {step === "review" && dryRunResult && installedRule && (
        <div className="space-y-3 rounded-lg border border-subtle bg-surface-1 p-4">
          <p className="text-13 text-secondary">{t("boards.settings.automation.templates.review_hint")}</p>
          <AutomationDryRunTimeline
            graph={installedRule.graph}
            steps={(dryRunResult.steps as Record<string, unknown>[]) ?? []}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="sm" onClick={() => handleInstall(true)} disabled={saving}>
              {t("boards.settings.automation.templates.install_publish_button")}
            </Button>
            <Button variant="neutral-primary" size="sm" onClick={() => setStep("configure")}>
              {t("boards.settings.automation.templates.edit_params")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});
