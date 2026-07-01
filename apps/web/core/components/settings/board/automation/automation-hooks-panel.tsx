import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import type { IBoardAutomationHook, TAutomationHookEvent, TAutomationHookHandler } from "@operoz/types";
import { TextArea } from "@operoz/ui";

export type HookFormValues = {
  name: string;
  enabled: boolean;
  event: TAutomationHookEvent;
  matcher: string;
  handler_type: TAutomationHookHandler;
  config_json: string;
};

type Props = {
  hooks: IBoardAutomationHook[];
  saving: boolean;
  onCreate: (values: HookFormValues) => Promise<void>;
  onDelete: (hookId: string) => Promise<void>;
};

const DEFAULT_FORM: HookFormValues = {
  name: "",
  enabled: true,
  event: "pre_action",
  matcher: "",
  handler_type: "block_catalog_key",
  config_json: '{"catalog_keys":["action.webhook"]}',
};

function parseConfig(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  if (!trimmed) return {};
  return JSON.parse(trimmed) as Record<string, unknown>;
}

export function AutomationHooksPanel({ hooks, saving, onCreate, onDelete }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<HookFormValues>(DEFAULT_FORM);

  const handleCreate = async () => {
    await onCreate({ ...form, config_json: form.config_json });
    setForm(DEFAULT_FORM);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-16 font-semibold text-primary">{t("boards.settings.automation.hooks.title")}</h2>
        <p className="mt-1 text-13 text-secondary">{t("boards.settings.automation.hooks.subtitle")}</p>
      </div>

      <div className="rounded-lg border border-subtle bg-layer-1 p-4">
        <p className="text-13 font-medium text-primary">{t("boards.settings.automation.hooks.create_title")}</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="block text-12 text-secondary">
            {t("boards.settings.automation.hooks.field_name")}
            <input
              className="mt-1 w-full rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-13"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </label>
          <label className="block text-12 text-secondary">
            {t("boards.settings.automation.hooks.field_event")}
            <select
              className="mt-1 w-full rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-13"
              value={form.event}
              onChange={(e) => setForm((prev) => ({ ...prev, event: e.target.value as TAutomationHookEvent }))}
            >
              <option value="pre_dispatch">pre_dispatch</option>
              <option value="pre_action">pre_action</option>
              <option value="post_action">post_action</option>
              <option value="on_failure">on_failure</option>
              <option value="on_complete">on_complete</option>
            </select>
          </label>
          <label className="block text-12 text-secondary">
            {t("boards.settings.automation.hooks.field_handler")}
            <select
              className="mt-1 w-full rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-13"
              value={form.handler_type}
              onChange={(e) => setForm((prev) => ({ ...prev, handler_type: e.target.value as TAutomationHookHandler }))}
            >
              <option value="block_catalog_key">block_catalog_key</option>
              <option value="webhook_domain_allowlist">webhook_domain_allowlist</option>
              <option value="record_metric">record_metric</option>
            </select>
          </label>
          <label className="block text-12 text-secondary">
            {t("boards.settings.automation.hooks.field_matcher")}
            <input
              className="mt-1 w-full rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-13"
              value={form.matcher}
              placeholder="action.webhook"
              onChange={(e) => setForm((prev) => ({ ...prev, matcher: e.target.value }))}
            />
          </label>
          <label className="block text-12 text-secondary md:col-span-2">
            {t("boards.settings.automation.hooks.field_config")}
            <TextArea
              className="font-mono mt-1 min-h-[88px] text-12"
              value={form.config_json}
              onChange={(e) => setForm((prev) => ({ ...prev, config_json: e.target.value }))}
            />
          </label>
        </div>
        <Button
          variant="primary"
          size="sm"
          className="mt-3"
          disabled={saving || !form.name.trim()}
          onClick={() => void handleCreate().catch(() => undefined)}
        >
          <Plus className="mr-1 size-3.5" />
          {t("boards.settings.automation.hooks.create_button")}
        </Button>
      </div>

      <div className="space-y-2">
        {hooks.length === 0 ? (
          <p className="rounded-lg border border-subtle bg-layer-1 p-4 text-13 text-tertiary">
            {t("boards.settings.automation.hooks.empty")}
          </p>
        ) : (
          hooks.map((hook) => (
            <div
              key={hook.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-subtle bg-layer-1 p-3"
            >
              <div className="min-w-0">
                <p className="text-13 font-medium text-primary">{hook.name}</p>
                <p className="mt-1 text-12 text-tertiary">
                  {hook.event} · {hook.handler_type}
                  {hook.matcher ? ` · ${hook.matcher}` : ""}
                </p>
              </div>
              <Button
                variant="link"
                size="sm"
                className="text-danger shrink-0"
                disabled={saving}
                onClick={() => void onDelete(hook.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export { parseConfig };
