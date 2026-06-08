import { useMemo, useState } from "react";
import { Filter, GitBranch, Play, Workflow, Zap } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import type { IBoardAutomationRule } from "@operis/types";
import { cn } from "@operis/ui";
import { AutomationCardMeta } from "./automation-card-meta";
import { AutomationCreateCard } from "./automation-create-card";
import { AutomationFlowStrip } from "./automation-flow-strip";
import { AutomationGridCard } from "./automation-grid-card";
import {
  collectRuleTriggerOptions,
  filterAndSortAutomationRules,
  hasActiveAutomationRulesFilters,
  type AutomationRulesFilterState,
} from "./automation-rules-filter";
import { AutomationRulesListToolbar } from "./automation-rules-list-toolbar";
import { useAutomationMemberLabels } from "./use-automation-member-labels";
import { AutomationListHero } from "./automation-list-hero";
import { automationGraphForDisplay, automationPublicationBadge } from "./automation-publication";
import { summarizeAutomationGraph } from "./automation-utils";
import "./automation-list.css";

const DEFAULT_FILTERS: AutomationRulesFilterState = {
  search: "",
  status: "all",
  triggerKey: "all",
  sort: "updated_desc",
};

type Props = {
  workspaceSlug: string;
  boardSlug: string;
  rules: IBoardAutomationRule[];
  creating: boolean;
  onCreate: () => void;
  onEdit: (rule: IBoardAutomationRule) => void;
  onDelete: (ruleId: string) => void;
  onToggleEnabled: (rule: IBoardAutomationRule) => void;
};

export function BoardAutomationRulesList(props: Props) {
  const { workspaceSlug, boardSlug, rules, creating, onCreate, onEdit, onDelete, onToggleEnabled } = props;
  const { t } = useTranslation();
  const { resolveUser } = useAutomationMemberLabels(workspaceSlug, boardSlug);
  const [filters, setFilters] = useState<AutomationRulesFilterState>(DEFAULT_FILTERS);

  const highlights = [
    { label: t("boards.settings.automation.highlights.triggers"), icon: Zap, tone: "accent" as const },
    { label: t("boards.settings.automation.highlights.filters"), icon: Filter, tone: "warning" as const },
    { label: t("boards.settings.automation.highlights.decisions"), icon: GitBranch, tone: "purple" as const },
    { label: t("boards.settings.automation.highlights.actions"), icon: Play, tone: "success" as const },
  ];

  const activeCount = rules.filter((r) => r.enabled && r.is_published).length;
  const triggerOptions = useMemo(() => collectRuleTriggerOptions(rules), [rules]);
  const filteredRules = useMemo(
    () => filterAndSortAutomationRules(rules, filters),
    [rules, filters]
  );
  const hasActiveFilters = hasActiveAutomationRulesFilters(filters);

  const patchFilters = (patch: Partial<AutomationRulesFilterState>) => {
    setFilters((current) => ({ ...current, ...patch }));
  };

  return (
    <div className="space-y-6">
      <AutomationListHero
        icon={Workflow}
        title={t("boards.settings.automation.hero.rules_title")}
        description={t("boards.settings.automation.lead")}
        createLabel={t("boards.settings.automation.create_rule")}
        onCreate={onCreate}
        highlights={highlights}
        showCreateAction={false}
      />

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-13 font-semibold text-secondary">
              {t("boards.settings.automation.rules_list.title")}
            </h2>
            <span className="rounded-full bg-layer-2 px-2 py-0.5 text-11 text-tertiary">{rules.length}</span>
          </div>
          {activeCount > 0 && (
            <p className="text-11 text-tertiary">
              {t("boards.settings.automation.hero.active_count", { count: activeCount })}
            </p>
          )}
        </div>

        {rules.length > 0 && (
          <AutomationRulesListToolbar
            filters={filters}
            onChange={patchFilters}
            onClear={() => setFilters(DEFAULT_FILTERS)}
            triggerOptions={triggerOptions}
            totalCount={rules.length}
            filteredCount={filteredRules.length}
            hasActiveFilters={hasActiveFilters}
          />
        )}

        {rules.length === 0 ? (
          <div className="automation-card-grid">
            <AutomationCreateCard
              label={t("boards.settings.automation.create_rule")}
              hint={t("boards.settings.automation.rules_list.empty_description")}
              loading={creating}
              onClick={onCreate}
            />
          </div>
        ) : filteredRules.length === 0 ? (
          <p className="rounded-xl border border-subtle bg-layer-1 px-4 py-10 text-center text-13 text-tertiary">
            {t("boards.settings.automation.rules_list.filters.no_results")}
          </p>
        ) : (
          <div className="automation-card-grid">
            <AutomationCreateCard
              label={t("boards.settings.automation.create_rule")}
              hint={t("boards.settings.automation.hero.create_rule_hint")}
              loading={creating}
              onClick={onCreate}
            />
            {filteredRules.map((rule) => {
              const displayGraph = automationGraphForDisplay(rule);
              const summary = summarizeAutomationGraph(displayGraph);
              const publication = automationPublicationBadge(rule);
              const publicationToneClass = {
                neutral: "bg-layer-2 text-secondary",
                warning: "bg-warning-subtle text-warning-primary",
                success: "bg-success-subtle text-success-primary",
                accent: "bg-accent-subtle text-accent-primary",
              }[publication.tone];

              return (
                <AutomationGridCard
                  key={rule.id}
                  title={rule.name}
                  isActive={rule.enabled && rule.is_published}
                  icon={
                    <span
                      className={cn(
                        "grid size-10 place-items-center rounded-lg border border-subtle shadow-sm",
                        rule.enabled && rule.is_published
                          ? "bg-accent-subtle/70 text-accent-primary"
                          : "bg-layer-2 text-tertiary"
                      )}
                    >
                      <Workflow className="size-4" strokeWidth={1.75} />
                    </span>
                  }
                  description={
                    rule.description || t("boards.settings.automation.rules_list.no_description")
                  }
                  badges={
                    <>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-10 font-semibold uppercase tracking-wide",
                          publicationToneClass
                        )}
                      >
                        {t(publication.labelKey)}
                      </span>
                      {rule.has_unpublished_changes && (
                        <span className="rounded-full bg-accent-subtle/60 px-2 py-0.5 text-10 font-medium text-accent-primary">
                          {t("boards.settings.automation.editor.unsaved_changes")}
                        </span>
                      )}
                    </>
                  }
                  visual={
                    <AutomationFlowStrip
                      triggerLabel={summary.triggerLabel}
                      stepCount={summary.stepCount}
                      actionCount={summary.actions}
                      decisionCount={summary.decisions}
                      isActive={rule.enabled && rule.is_published}
                    />
                  }
                  meta={
                    <AutomationCardMeta
                      createdAt={rule.created_at}
                      updatedAt={rule.updated_at}
                      createdById={rule.created_by}
                      updatedById={rule.updated_by}
                      resolveUser={resolveUser}
                    />
                  }
                  onOpen={() => onEdit(rule)}
                  onToggle={() => onToggleEnabled(rule)}
                  onEdit={() => onEdit(rule)}
                  onDelete={() => onDelete(rule.id)}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
