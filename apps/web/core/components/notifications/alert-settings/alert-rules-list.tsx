import { observer } from "mobx-react";
import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "@operis/i18n";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { TAlertChannel, TAlertRule, TAlertType } from "@operis/types";
import { AlertModalCore, Badge, ToggleSwitch } from "@operis/ui";
import { Button } from "@operis/propel/button";
import { useProject } from "@/hooks/store/use-project";
import { useAlertStore } from "@/hooks/store/notifications/use-alert";
import { AlertRuleFormModal } from "./alert-rule-form";

function alertTypeBadgeVariant(alertType: TAlertType): "neutral" | "warning" | "destructive" | "success" {
  if (alertType.includes("overdue") || alertType.includes("breached")) return "destructive";
  if (alertType.includes("approaching") || alertType.includes("sla")) return "warning";
  if (alertType.includes("created") || alertType.includes("accepted")) return "success";
  return "neutral";
}

export const AlertRulesList = observer(function AlertRulesList({ workspaceSlug }: { workspaceSlug: string }) {
  const { t } = useTranslation();
  const alertStore = useAlertStore();
  const { getPartialProjectById } = useProject();
  const [editingRule, setEditingRule] = useState<TAlertRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<TAlertRule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    void alertStore.fetchAlertRules(workspaceSlug);
  }, [alertStore, workspaceSlug]);

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
    return <p className="text-13 text-tertiary">{t("common.loading")}</p>;
  }

  if (alertStore.rulesArray.length === 0) {
    return (
      <div className="rounded-md border border-subtle bg-layer-1 p-4">
        <p className="text-13 text-secondary">{t("alert.rules.empty")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col divide-y divide-subtle rounded-md border border-subtle bg-layer-1">
        {alertStore.rulesArray.map((rule) => {
          const project = rule.project ? getPartialProjectById(rule.project) : null;
          return (
            <div key={rule.id} className="flex items-center justify-between gap-3 p-4">
              <button
                type="button"
                className="-m-1 min-w-0 flex-1 rounded-sm p-1 text-left hover:bg-layer-transparent-hover"
                onClick={() => setEditingRule(rule)}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-13 font-medium text-primary">
                    {rule.name || t(`alert.type.${rule.alert_type}` as "alert.type.issue_created")}
                  </p>
                  <Badge variant={alertTypeBadgeVariant(rule.alert_type)} size="sm" disabled>
                    {t(`alert.type.${rule.alert_type}` as "alert.type.issue_created")}
                  </Badge>
                  {project && (
                    <Badge variant="neutral" size="sm" disabled>
                      {project.name}
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-11 text-tertiary">
                  {(rule.channels ?? []).map((ch) => t(`alert.channel.${ch}` as "alert.channel.email")).join(" · ")}
                </p>
              </button>
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setEditingRule(rule)}>
                  <Pencil size={14} strokeWidth={1.75} />
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setDeletingRule(rule)}>
                  <Trash2 size={14} strokeWidth={1.75} />
                </Button>
                <ToggleSwitch
                  value={rule.enabled}
                  onChange={(enabled) => void alertStore.toggleAlertRule(workspaceSlug, rule.id, enabled)}
                />
              </div>
            </div>
          );
        })}
      </div>

      <AlertRuleFormModal
        isOpen={Boolean(editingRule)}
        mode="edit"
        rule={editingRule}
        workspaceSlug={workspaceSlug}
        onClose={() => setEditingRule(null)}
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

export const AlertRuleFormTrigger = observer(function AlertRuleFormTrigger({
  workspaceSlug,
}: {
  workspaceSlug: string;
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setIsOpen(true)}>
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
    <label className="flex items-center justify-between gap-3 rounded-sm border border-subtle bg-surface-1 px-3 py-2">
      <span className="text-13 text-primary">{t(`alert.channel.${channel}` as "alert.channel.email")}</span>
      <ToggleSwitch value={enabled} onChange={onChange} />
    </label>
  );
});
