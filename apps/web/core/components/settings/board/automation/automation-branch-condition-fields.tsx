import { useTranslation } from "@operoz/i18n";
import { DECISION_CONDITION_OPTIONS } from "./automation-utils";
import type { AutomationBoardContext } from "./use-automation-board-context";
import { ConfigCheckboxList, ConfigField, ConfigSelect } from "./automation-config-primitives";

const FIELD_CHANGE_OPTIONS = [
  { id: "name", label: "Nome" },
  { id: "state_id", label: "Estado" },
  { id: "priority", label: "Prioridade" },
  { id: "assignees", label: "Responsáveis" },
  { id: "description_html", label: "Descrição" },
  { id: "target_date", label: "Data alvo" },
  { id: "start_date", label: "Data início" },
];

type Props = {
  filterKey: string;
  filterConfig: Record<string, unknown>;
  boardContext: AutomationBoardContext;
  onChange: (filterKey: string, filterConfig: Record<string, unknown>) => void;
};

export function AutomationBranchConditionFields(props: Props) {
  const { filterKey, filterConfig, boardContext, onChange } = props;
  const { t } = useTranslation();

  const patchConfig = (patch: Record<string, unknown>) => {
    onChange(filterKey, { ...filterConfig, ...patch });
  };

  if (filterKey === "decision.else") {
    return <p className="text-11 text-tertiary">{t("boards.settings.automation.decision.else_hint")}</p>;
  }

  if (filterKey === "filter.state") {
    return (
      <ConfigField label={t("boards.settings.automation.config.states")}>
        <ConfigCheckboxList
          options={boardContext.states}
          selected={(filterConfig.state_ids as string[]) ?? []}
          onChange={(state_ids) => patchConfig({ state_ids })}
          emptyMessage={t("boards.settings.automation.config.states_empty")}
        />
      </ConfigField>
    );
  }

  if (filterKey === "filter.project") {
    return (
      <ConfigField label={t("boards.settings.automation.config.projects")}>
        <ConfigCheckboxList
          options={boardContext.projects}
          selected={(filterConfig.project_ids as string[]) ?? []}
          onChange={(project_ids) => patchConfig({ project_ids })}
          emptyMessage={t("boards.settings.automation.config.projects_empty")}
        />
      </ConfigField>
    );
  }

  if (filterKey === "filter.assignee") {
    return (
      <>
        <ConfigField label={t("boards.settings.automation.config.assignees")}>
          <ConfigCheckboxList
            options={boardContext.members}
            selected={(filterConfig.assignee_ids as string[]) ?? []}
            onChange={(assignee_ids) => patchConfig({ assignee_ids })}
            emptyMessage={t("boards.settings.automation.config.members_empty")}
          />
        </ConfigField>
        <ConfigField label={t("boards.settings.automation.config.assignee_mode")}>
          <ConfigSelect
            value={(filterConfig.mode as string) ?? "any"}
            onChange={(mode) => patchConfig({ mode })}
            options={[
              { value: "any", label: t("boards.settings.automation.config.mode_any") },
              { value: "all", label: t("boards.settings.automation.config.mode_all") },
            ]}
          />
        </ConfigField>
      </>
    );
  }

  if (filterKey === "filter.field_changed") {
    return (
      <ConfigField label={t("boards.settings.automation.config.changed_fields")}>
        <ConfigCheckboxList
          options={FIELD_CHANGE_OPTIONS}
          selected={(filterConfig.fields as string[]) ?? []}
          onChange={(fields) => patchConfig({ fields })}
        />
      </ConfigField>
    );
  }

  return null;
}

export function AutomationBranchConditionSelect(props: { value: string; onChange: (filterKey: string) => void }) {
  const { value, onChange } = props;
  const { t } = useTranslation();
  return (
    <ConfigField label={t("boards.settings.automation.decision.condition")}>
      <ConfigSelect
        value={value}
        onChange={onChange}
        options={DECISION_CONDITION_OPTIONS.map((opt) => ({ value: opt.key, label: opt.label }))}
      />
    </ConfigField>
  );
}
