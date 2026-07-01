import { observer } from "mobx-react";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@operoz/i18n";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { TAlertChannel, TAlertRule } from "@operoz/types";
import { AlertModalCore, ToggleSwitch, cn } from "@operoz/ui";
import { Button } from "@operoz/propel/button";
import { EmptyStateCompact } from "@operoz/propel/empty-state";
import { Loader } from "@operoz/ui";
import { useAlertStore } from "@/hooks/store/notifications/use-alert";
import { AlertRuleCard } from "./alert-rule-card";
import { AlertRuleFormModal } from "./alert-rule-form";
import { DEFAULT_ALERT_RULES_FILTERS, filterAlertRules, hasActiveAlertRulesFilters } from "./alert-rules-filter";
import { AlertRulesToolbar } from "./alert-rules-toolbar";
import "../alerts-settings.css";

export const AlertRulesList = observer(function AlertRulesList({ workspaceSlug }: { workspaceSlug: string }) {
  const { t } = useTranslation();
  const alertStore = useAlertStore();
  const [editingRule, setEditingRule] = useState<TAlertRule | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingRule, setDeletingRule] = useState<TAlertRule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_ALERT_RULES_FILTERS);

  useEffect(() => {
    void alertStore.fetchAlertRules(workspaceSlug);
  }, [alertStore, workspaceSlug]);

  const labelForType = (type: string) => t(`alert.type.${type}` as "alert.type.issue_created");

  const filteredRules = useMemo(
    () => filterAlertRules(alertStore.rulesArray, filters, labelForType),
    [alertStore.rulesArray, filters, t]
  );

  const handleDelete = () => {
    if (!deletingRule) return;
    setIsDeleting(true);
    void alertStore
      .deleteAlertRule(workspaceSlug, deletingRule.id)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("success"),
          message: t("alert.form.deleted"),
        });
        setDeletingRule(null);
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("error"),
          message: t("alert.form.delete_error"),
        });
      })
      .finally(() => {
        setIsDeleting(false);
      });
  };

  if (alertStore.isLoadingRules) {
    return (
      <Loader className="alerts-settings-card-grid w-full">
        <Loader.Item height="200px" />
        <Loader.Item height="200px" />
        <Loader.Item height="200px" />
      </Loader>
    );
  }

  if (alertStore.rulesArray.length === 0) {
    return (
      <>
        <EmptyStateCompact
          assetKey="settings"
          title={t("alert.rules.empty")}
          description={t("alert.rules.empty_hint")}
          actions={[
            {
              label: t("alert.rules.create"),
              onClick: () => setIsCreateOpen(true),
            },
          ]}
        />
        <AlertRuleFormModal
          isOpen={isCreateOpen}
          mode="create"
          rule={null}
          workspaceSlug={workspaceSlug}
          onClose={() => setIsCreateOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <AlertRulesToolbar filters={filters} resultCount={filteredRules.length} onChange={setFilters} />

      {filteredRules.length === 0 ? (
        <EmptyStateCompact
          assetKey="search"
          title={t("alert.rules.filters.empty_search")}
          description={t("alert.rules.filters.empty_search_hint")}
          actions={
            hasActiveAlertRulesFilters(filters)
              ? [
                  {
                    label: t("alert.rules.filters.clear"),
                    onClick: () => setFilters(DEFAULT_ALERT_RULES_FILTERS),
                  },
                ]
              : undefined
          }
        />
      ) : (
        <div className="alerts-settings-card-grid">
          <AlertRuleCreateCard onClick={() => setIsCreateOpen(true)} />
          {filteredRules.map((rule) => (
            <AlertRuleCard
              key={rule.id}
              rule={rule}
              onEdit={() => setEditingRule(rule)}
              onDelete={() => setDeletingRule(rule)}
              onToggle={(enabled) => void alertStore.toggleAlertRule(workspaceSlug, rule.id, enabled)}
            />
          ))}
        </div>
      )}

      <AlertRuleFormModal
        isOpen={Boolean(editingRule)}
        mode="edit"
        rule={editingRule}
        workspaceSlug={workspaceSlug}
        onClose={() => setEditingRule(null)}
      />

      <AlertRuleFormModal
        isOpen={isCreateOpen}
        mode="create"
        rule={null}
        workspaceSlug={workspaceSlug}
        onClose={() => setIsCreateOpen(false)}
      />

      <AlertModalCore
        isOpen={Boolean(deletingRule)}
        handleClose={() => setDeletingRule(null)}
        title={t("alert.form.delete_title")}
        content={t("alert.form.delete_confirm", {
          name:
            deletingRule?.name ||
            t(`alert.type.${deletingRule?.alert_type ?? "issue_created"}` as "alert.type.issue_created"),
        })}
        primaryButtonText={{
          default: t("alert.form.delete_confirm_action"),
          loading: t("alert.form.delete_confirm_action"),
        }}
        secondaryButtonText={t("cancel")}
        handleSubmit={handleDelete}
        isSubmitting={isDeleting}
        variant="danger"
      />
    </>
  );
});

function AlertRuleCreateCard({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex h-full min-h-[200px] w-full flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-subtle",
        "bg-transparent px-5 py-8 text-center transition-all duration-150",
        "hover:border-accent-subtle hover:bg-accent-subtle/10",
        "focus-visible:ring-accent-primary focus-visible:ring-offset-surface-1 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      )}
    >
      <span className="grid size-11 place-items-center rounded-xl border border-subtle bg-layer-1 text-accent-primary transition-colors group-hover:border-accent-subtle group-hover:bg-accent-subtle/30">
        <Plus className="size-5" strokeWidth={1.75} />
      </span>
      <span className="text-13 font-semibold text-primary">{t("alert.rules.create")}</span>
      <span className="max-w-[12rem] text-11 leading-relaxed text-tertiary">{t("alert.rules.create_hint")}</span>
    </button>
  );
}

export const AlertRuleFormTrigger = observer(function AlertRuleFormTrigger({
  workspaceSlug,
}: {
  workspaceSlug: string;
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="primary" size="base" onClick={() => setIsOpen(true)}>
        {t("alert.rules.create")}
      </Button>
      <AlertRuleFormModal
        isOpen={isOpen}
        mode="create"
        rule={null}
        workspaceSlug={workspaceSlug}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
});

export const ChannelToggle = observer(function ChannelToggle({
  channel,
  enabled,
  onChange,
}: {
  channel: TAlertChannel;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-subtle bg-surface-1 px-3 py-2.5 transition-colors hover:bg-layer-1-hover">
      <span className="text-13 text-primary">{t(`alert.channel.${channel}` as "alert.channel.email")}</span>
      <ToggleSwitch value={enabled} onChange={onChange} />
    </label>
  );
});
