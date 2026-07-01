import { Link } from "react-router";
import { useTranslation } from "@operoz/i18n";
import { ISSUE_PRIORITY_FILTERS } from "@operoz/constants";
import type { TAutomationCatalog, TAutomationCatalogItem } from "@operoz/types";
import type { AutomationNodeData } from "./automation-utils";
import {
  ConfigCheckboxList,
  ConfigField,
  ConfigSelect,
  ConfigTextArea,
  ConfigTextInput,
} from "./automation-config-primitives";
import type { AutomationBoardContext } from "./use-automation-board-context";
import { isBranchingAction } from "./automation-utils";
import { ScheduleCronConfigForm } from "./schedule-cron-config";

const FIELD_CHANGE_OPTIONS = [
  { id: "name", label: "Nome" },
  { id: "state_id", label: "Estado" },
  { id: "priority", label: "Prioridade" },
  { id: "assignees", label: "Responsáveis" },
  { id: "description_html", label: "Descrição" },
  { id: "target_date", label: "Data alvo" },
  { id: "start_date", label: "Data início" },
];

const SET_FIELD_OPTIONS = [
  { value: "state_id", label: "Estado" },
  { value: "priority", label: "Prioridade" },
  { value: "name", label: "Nome" },
];

type Props = {
  data: AutomationNodeData;
  catalog: TAutomationCatalog;
  boardContext: AutomationBoardContext;
  workspaceSlug: string;
  boardSlug: string;
  onUpdateData: (patch: Partial<AutomationNodeData>) => void;
};

function catalogItemsForKind(catalog: TAutomationCatalog, kind: AutomationNodeData["kind"]): TAutomationCatalogItem[] {
  if (kind === "trigger") return catalog.triggers ?? [];
  if (kind === "filter") return catalog.filters ?? [];
  if (kind === "action") return catalog.actions ?? [];
  return [];
}

function defaultConfigForKey(catalogKey: string): Record<string, unknown> {
  switch (catalogKey) {
    case "filter.project":
      return { project_ids: [] };
    case "filter.state":
      return { state_ids: [] };
    case "filter.assignee":
      return { assignee_ids: [], mode: "any" };
    case "filter.field_changed":
      return { fields: [] };
    case "action.set_field":
      return { field: "state_id", value: "" };
    case "action.add_comment":
      return { comment_html: "" };
    case "action.webhook":
      return { url: "" };
    case "action.notify":
      return { user_ids: [], message: "" };
    case "action.run_script":
      return { script_id: "" };
    case "action.send_email":
      return { template_id: "", recipient_user_ids: [], recipient_emails: [] };
    case "schedule.cron":
      return {
        preset: "daily",
        time: "09:00",
        weekdays: [0, 1, 2, 3, 4],
        day_of_month: 1,
        cron: "0 9 * * *",
        timezone: "America/Sao_Paulo",
      };
    default:
      if (catalogKey.startsWith("issue.")) return { event_type: catalogKey };
      return {};
  }
}

function parseEmailList(raw: string): string[] {
  return raw
    .split(/[,;\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function AutomationNodeConfigForm(props: Props) {
  const { data, catalog, boardContext, workspaceSlug, boardSlug, onUpdateData } = props;
  const { t } = useTranslation();
  const config = data.config ?? {};

  const patchConfig = (patch: Record<string, unknown>) => {
    onUpdateData({ config: { ...config, ...patch } });
  };

  const changeCatalogItem = (catalogKey: string) => {
    const items = catalogItemsForKind(catalog, data.kind);
    const item = items.find((i) => i.key === catalogKey);
    if (!item) return;
    onUpdateData({
      catalog_key: catalogKey,
      label: item.label,
      config: defaultConfigForKey(catalogKey),
    });
  };

  const kindItems = catalogItemsForKind(catalog, data.kind);

  return (
    <div className="space-y-1">
      {kindItems.length > 0 && (
        <ConfigField
          label={
            data.kind === "trigger"
              ? t("boards.settings.automation.config.when")
              : data.kind === "filter"
                ? t("boards.settings.automation.config.filter_type")
                : t("boards.settings.automation.config.action_type")
          }
        >
          <ConfigSelect
            value={data.catalog_key}
            onChange={changeCatalogItem}
            options={kindItems.map((item) => ({ value: item.key, label: item.label }))}
          />
        </ConfigField>
      )}

      {(data.catalog_key.startsWith("issue.") || data.catalog_key === "schedule.cron") && (
        <p className="mb-3 text-11 text-tertiary">{kindItems.find((i) => i.key === data.catalog_key)?.description}</p>
      )}

      {data.catalog_key === "schedule.cron" && (
        <ScheduleCronConfigForm config={config} onChange={(patch) => patchConfig(patch)} />
      )}

      {data.catalog_key === "filter.state" && (
        <ConfigField label={t("boards.settings.automation.config.states")}>
          <ConfigCheckboxList
            options={boardContext.states}
            selected={(config.state_ids as string[]) ?? []}
            onChange={(state_ids) => patchConfig({ state_ids })}
            emptyMessage={t("boards.settings.automation.config.states_empty")}
          />
        </ConfigField>
      )}

      {data.catalog_key === "filter.project" && (
        <ConfigField label={t("boards.settings.automation.config.projects")}>
          <ConfigCheckboxList
            options={boardContext.projects}
            selected={(config.project_ids as string[]) ?? []}
            onChange={(project_ids) => patchConfig({ project_ids })}
            emptyMessage={t("boards.settings.automation.config.projects_empty")}
          />
        </ConfigField>
      )}

      {data.catalog_key === "filter.assignee" && (
        <>
          <ConfigField label={t("boards.settings.automation.config.assignees")}>
            <ConfigCheckboxList
              options={boardContext.members}
              selected={(config.assignee_ids as string[]) ?? []}
              onChange={(assignee_ids) => patchConfig({ assignee_ids })}
              emptyMessage={t("boards.settings.automation.config.members_empty")}
            />
          </ConfigField>
          <ConfigField label={t("boards.settings.automation.config.assignee_mode")}>
            <ConfigSelect
              value={(config.mode as string) ?? "any"}
              onChange={(mode) => patchConfig({ mode })}
              options={[
                { value: "any", label: t("boards.settings.automation.config.mode_any") },
                { value: "all", label: t("boards.settings.automation.config.mode_all") },
              ]}
            />
          </ConfigField>
        </>
      )}

      {data.catalog_key === "filter.field_changed" && (
        <ConfigField label={t("boards.settings.automation.config.changed_fields")}>
          <ConfigCheckboxList
            options={FIELD_CHANGE_OPTIONS}
            selected={(config.fields as string[]) ?? []}
            onChange={(fields) => patchConfig({ fields })}
          />
        </ConfigField>
      )}

      {data.catalog_key === "action.set_field" && (
        <>
          <ConfigField label={t("boards.settings.automation.config.field")}>
            <ConfigSelect
              value={(config.field as string) ?? "state_id"}
              onChange={(field) => patchConfig({ field, value: "" })}
              options={SET_FIELD_OPTIONS.map((o) => ({
                value: o.value,
                label: t(`boards.settings.automation.config.set_field_${o.value}`),
              }))}
            />
          </ConfigField>
          {config.field === "state_id" && (
            <ConfigField label={t("boards.settings.automation.config.new_state")}>
              <ConfigSelect
                value={(config.value as string) ?? ""}
                onChange={(value) => patchConfig({ value })}
                placeholder={t("boards.settings.automation.config.select_placeholder")}
                options={boardContext.states.map((s) => ({ value: s.id, label: s.label }))}
              />
            </ConfigField>
          )}
          {config.field === "priority" && (
            <ConfigField label={t("boards.settings.automation.config.new_priority")}>
              <ConfigSelect
                value={(config.value as string) ?? ""}
                onChange={(value) => patchConfig({ value })}
                options={ISSUE_PRIORITY_FILTERS.map((p) => ({
                  value: p.key,
                  label: t(p.titleTranslationKey),
                }))}
              />
            </ConfigField>
          )}
          {config.field === "name" && (
            <ConfigField label={t("boards.settings.automation.config.new_name")}>
              <ConfigTextInput value={(config.value as string) ?? ""} onChange={(value) => patchConfig({ value })} />
            </ConfigField>
          )}
        </>
      )}

      {data.catalog_key === "action.add_comment" && (
        <ConfigField label={t("boards.settings.automation.config.comment")}>
          <ConfigTextArea
            value={(config.comment_html as string) ?? ""}
            onChange={(comment_html) => patchConfig({ comment_html })}
            placeholder={t("boards.settings.automation.config.comment_placeholder")}
          />
        </ConfigField>
      )}

      {data.catalog_key === "action.webhook" && (
        <ConfigField label={t("boards.settings.automation.config.webhook_url")}>
          <ConfigTextInput
            value={(config.url as string) ?? ""}
            onChange={(url) => patchConfig({ url })}
            placeholder="https://..."
          />
        </ConfigField>
      )}

      {data.catalog_key === "action.notify" && (
        <>
          <ConfigField label={t("boards.settings.automation.config.notify_members")}>
            <ConfigCheckboxList
              options={boardContext.members}
              selected={(config.user_ids as string[]) ?? []}
              onChange={(user_ids) => patchConfig({ user_ids })}
              emptyMessage={t("boards.settings.automation.config.members_empty")}
            />
          </ConfigField>
          <ConfigField label={t("boards.settings.automation.config.notify_message")}>
            <ConfigTextInput
              value={(config.message as string) ?? ""}
              onChange={(message) => patchConfig({ message })}
            />
          </ConfigField>
        </>
      )}

      {data.catalog_key === "action.retry_until" && (
        <>
          <ConfigField label={t("boards.settings.automation.retry.max_iterations")}>
            <ConfigTextInput
              value={String(config.max_iterations ?? 3)}
              onChange={(value) => patchConfig({ max_iterations: Number.parseInt(value, 10) || 1 })}
            />
          </ConfigField>
          <ConfigField label={t("boards.settings.automation.retry.backoff_seconds")}>
            <ConfigTextInput
              value={String(config.backoff_seconds ?? 1)}
              onChange={(value) => patchConfig({ backoff_seconds: Number.parseFloat(value) || 0 })}
            />
          </ConfigField>
          <p className="text-11 text-tertiary">{t("boards.settings.automation.retry.hint")}</p>
        </>
      )}

      {data.kind === "action" && isBranchingAction(data.catalog_key) && (
        <p className="mb-3 rounded-md border border-subtle bg-layer-1 px-3 py-2 text-11 leading-relaxed text-tertiary">
          {t("boards.settings.automation.config.branching_hint")}
        </p>
      )}

      {data.catalog_key === "action.run_script" && (
        <>
          <ConfigField label={t("boards.settings.automation.config.script")}>
            <ConfigSelect
              value={(config.script_id as string) ?? ""}
              onChange={(script_id) => patchConfig({ script_id })}
              placeholder={t("boards.settings.automation.config.select_placeholder")}
              options={boardContext.scripts.map((s) => ({ value: s.id, label: s.label }))}
            />
            {boardContext.scripts.length === 0 && (
              <p className="mt-1 text-11 text-tertiary">{t("boards.settings.automation.config.scripts_empty")}</p>
            )}
          </ConfigField>
          <Link
            to={`/${workspaceSlug}/settings/boards/${boardSlug}/automacao/scripts`}
            className="text-11 text-accent-primary hover:underline"
          >
            {t("boards.settings.automation.config.manage_scripts")}
          </Link>
        </>
      )}

      {data.catalog_key === "action.send_email" && (
        <>
          <ConfigField label={t("boards.settings.automation.config.email_template")}>
            <ConfigSelect
              value={(config.template_id as string) ?? ""}
              onChange={(template_id) => patchConfig({ template_id })}
              placeholder={t("boards.settings.automation.config.select_placeholder")}
              options={boardContext.emailTemplates.map((item) => ({ value: item.id, label: item.label }))}
            />
            {boardContext.emailTemplates.length === 0 && (
              <p className="mt-1 text-11 text-tertiary">{t("boards.settings.automation.config.templates_empty")}</p>
            )}
          </ConfigField>
          <ConfigField label={t("boards.settings.automation.config.email_recipients")}>
            <ConfigCheckboxList
              options={boardContext.members}
              selected={(config.recipient_user_ids as string[]) ?? []}
              onChange={(recipient_user_ids) => patchConfig({ recipient_user_ids })}
              emptyMessage={t("boards.settings.automation.config.members_empty")}
            />
          </ConfigField>
          <ConfigField
            label={t("boards.settings.automation.config.email_extra")}
            hint={t("boards.settings.automation.config.email_extra_hint")}
          >
            <ConfigTextInput
              value={((config.recipient_emails as string[]) ?? []).join(", ")}
              onChange={(raw) => patchConfig({ recipient_emails: parseEmailList(raw) })}
              placeholder="email@exemplo.com"
            />
          </ConfigField>
          <Link
            to={`/${workspaceSlug}/settings/boards/${boardSlug}/automacao/emails`}
            className="text-11 text-accent-primary hover:underline"
          >
            {t("boards.settings.automation.config.manage_emails")}
          </Link>
        </>
      )}
    </div>
  );
}
