import { BellRing } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@operoz/i18n";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import { Button } from "@operoz/propel/button";
import type {
  TAlertChannel,
  TAlertRule,
  TAlertRuleConfig,
  TAlertRulesPayload,
  TAlertType,
  TEscalationStep,
} from "@operoz/types";
import { EModalPosition, EModalWidth, Input, ModalCore, ToggleSwitch } from "@operoz/ui";
import { useProject } from "@/hooks/store/use-project";
import { useAlertStore } from "@/hooks/store/notifications/use-alert";
import { DueDateThresholds } from "./due-date-thresholds";

const ALL_ALERT_TYPES: TAlertType[] = [
  "issue_created",
  "due_date_approaching",
  "due_date_overdue",
  "missing_due_date",
  "state_change",
  "assignee_change",
  "intake_created",
  "support_ticket_created",
  "support_ticket_accepted",
  "support_sla_approaching",
  "support_sla_breached",
  "support_ticket_closed",
  "support_no_team_response",
  "issue_no_activity",
  "in_progress_too_long",
];

const ALL_CHANNELS: TAlertChannel[] = ["email", "in_app", "discord_dm", "google_calendar"];

const DEFAULT_THRESHOLDS = [7, 3, 1];
const DEFAULT_SLA_MINUTES = [60, 30, 15];

type Props = {
  isOpen: boolean;
  mode: "create" | "edit";
  rule: TAlertRule | null;
  workspaceSlug: string;
  onClose: () => void;
};

function readConfig(rule: TAlertRule | null): TAlertRuleConfig {
  if (!rule?.config || typeof rule.config !== "object") return {};
  return rule.config as TAlertRuleConfig;
}

function isSupportAlertType(alertType: TAlertType): boolean {
  return alertType.startsWith("support_");
}

function supportsNotifyToggles(alertType: TAlertType): boolean {
  return !isSupportAlertType(alertType) || alertType.startsWith("support_");
}

function supportsThresholdsDays(alertType: TAlertType): boolean {
  return alertType === "due_date_approaching";
}

function supportsGracePeriod(alertType: TAlertType): boolean {
  return alertType === "missing_due_date";
}

function supportsSlaMinutes(alertType: TAlertType): boolean {
  return alertType === "support_sla_approaching";
}

function supportsEscalation(alertType: TAlertType): boolean {
  return alertType === "due_date_approaching" || alertType === "support_sla_approaching";
}

export const AlertRuleFormModal = observer(function AlertRuleFormModal({
  isOpen,
  mode,
  rule,
  workspaceSlug,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const alertStore = useAlertStore();
  const { joinedProjectIds, getPartialProjectById } = useProject();

  const [saving, setSaving] = useState(false);
  const [alertType, setAlertType] = useState<TAlertType>("issue_created");
  const [name, setName] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [channels, setChannels] = useState<TAlertChannel[]>(["email", "in_app"]);
  const [config, setConfig] = useState<TAlertRuleConfig>({});
  const [escalationSchedule, setEscalationSchedule] = useState<TEscalationStep[]>([]);

  const projectOptions = useMemo(
    () =>
      joinedProjectIds
        .map((id) => getPartialProjectById(id))
        .filter((project): project is NonNullable<typeof project> => Boolean(project)),
    [getPartialProjectById, joinedProjectIds]
  );

  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit" && rule) {
      const ruleConfig = readConfig(rule);
      setAlertType(rule.alert_type);
      setName(rule.name);
      setEnabled(rule.enabled);
      setProjectId(rule.project);
      setChannels(rule.channels?.length ? [...rule.channels] : ["email", "in_app"]);
      setConfig({
        thresholds_days: ruleConfig.thresholds_days ?? DEFAULT_THRESHOLDS,
        grace_period_days: ruleConfig.grace_period_days ?? 3,
        thresholds_minutes: ruleConfig.thresholds_minutes ?? DEFAULT_SLA_MINUTES,
        notify_assignees: ruleConfig.notify_assignees ?? true,
        notify_creator: ruleConfig.notify_creator ?? (isSupportAlertType(rule.alert_type) ? true : false),
      });
      setEscalationSchedule(rule.escalation_schedule?.length ? [...rule.escalation_schedule] : []);
      return;
    }

    setAlertType("issue_created");
    setName("");
    setEnabled(true);
    setProjectId(null);
    setChannels(["email", "in_app"]);
    setConfig({
      thresholds_days: DEFAULT_THRESHOLDS,
      grace_period_days: 3,
      thresholds_minutes: DEFAULT_SLA_MINUTES,
      notify_assignees: true,
      notify_creator: false,
    });
    setEscalationSchedule([]);
  }, [isOpen, mode, rule]);

  const toggleChannel = (channel: TAlertChannel) => {
    setChannels((current) =>
      current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel]
    );
  };

  const patchConfig = (patch: Partial<TAlertRuleConfig>) => {
    setConfig((current) => ({ ...current, ...patch }));
  };

  const addEscalationStep = () => {
    setEscalationSchedule((current) => [...current, { days_before: 1, channels: ["email"] }]);
  };

  const updateEscalationStep = (index: number, patch: Partial<TEscalationStep>) => {
    setEscalationSchedule((current) => current.map((step, i) => (i === index ? { ...step, ...patch } : step)));
  };

  const removeEscalationStep = (index: number) => {
    setEscalationSchedule((current) => current.filter((_, i) => i !== index));
  };

  const buildPayload = (): TAlertRulesPayload => {
    const payloadConfig: TAlertRuleConfig = {};

    if (supportsThresholdsDays(alertType)) {
      payloadConfig.thresholds_days = config.thresholds_days ?? DEFAULT_THRESHOLDS;
    }
    if (supportsGracePeriod(alertType)) {
      payloadConfig.grace_period_days = config.grace_period_days ?? 3;
    }
    if (supportsSlaMinutes(alertType)) {
      payloadConfig.thresholds_minutes = config.thresholds_minutes ?? DEFAULT_SLA_MINUTES;
    }
    if (supportsNotifyToggles(alertType)) {
      payloadConfig.notify_assignees = config.notify_assignees ?? true;
      payloadConfig.notify_creator = config.notify_creator ?? (isSupportAlertType(alertType) ? true : false);
    }
    if (isSupportAlertType(alertType)) {
      payloadConfig.notify_project_lead = true;
      payloadConfig.notify_support_team = false;
    }

    return {
      alert_type: alertType,
      name: name.trim() || t(`alert.type.${alertType}` as "alert.type.issue_created"),
      enabled,
      project: projectId,
      channels,
      config: payloadConfig,
      escalation_schedule: supportsEscalation(alertType) ? escalationSchedule : [],
    };
  };

  const handleSubmit = async () => {
    if (channels.length === 0) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("alert.form.channels_required"),
      });
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (mode === "edit" && rule) {
        await alertStore.updateAlertRule(workspaceSlug, rule.id, payload);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("success"),
          message: t("alert.form.updated"),
        });
      } else {
        await alertStore.createAlertRule(workspaceSlug, payload);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("success"),
          message: t("alert.form.created"),
        });
      }
      onClose();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("alert.form.save_error"),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <div className="flex max-h-[85vh] flex-col">
        <div className="border-b border-subtle px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="grid size-10 place-items-center rounded-xl border border-subtle bg-accent-subtle text-accent-primary">
              <BellRing className="size-4" strokeWidth={1.75} />
            </span>
            <div>
              <h3 className="text-15 font-semibold text-primary">
                {mode === "create" ? t("alert.form.create_title") : t("alert.form.edit_title")}
              </h3>
              <p className="mt-1 text-13 text-tertiary">{t("alert.form.lead")}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <label className="block space-y-1">
            <span className="text-11 font-medium text-secondary">{t("alert.form.alert_type")}</span>
            <select
              className="w-full rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-13 text-primary"
              value={alertType}
              disabled={mode === "edit"}
              onChange={(e) => setAlertType(e.target.value as TAlertType)}
            >
              {ALL_ALERT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`alert.type.${type}` as "alert.type.issue_created")}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-11 font-medium text-secondary">{t("alert.form.name")}</span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t(`alert.type.${alertType}` as "alert.type.issue_created")}
            />
          </label>

          <div className="flex items-center justify-between rounded-sm border border-subtle bg-surface-1 px-3 py-2">
            <span className="text-13 text-primary">{t("alert.form.enabled")}</span>
            <ToggleSwitch value={enabled} onChange={setEnabled} />
          </div>

          <label className="block space-y-1">
            <span className="text-11 font-medium text-secondary">{t("alert.form.project_scope")}</span>
            <select
              className="w-full rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-13 text-primary"
              value={projectId ?? ""}
              onChange={(e) => setProjectId(e.target.value || null)}
            >
              <option value="">{t("alert.form.workspace_scope")}</option>
              {projectOptions.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="space-y-2">
            <legend className="text-11 font-medium text-secondary">{t("alert.form.channels")}</legend>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {ALL_CHANNELS.map((channel) => (
                <label
                  key={channel}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-sm border border-subtle bg-surface-1 px-3 py-2"
                >
                  <span className="text-13 text-primary">{t(`alert.channel.${channel}` as "alert.channel.email")}</span>
                  <input
                    type="checkbox"
                    checked={channels.includes(channel)}
                    onChange={() => toggleChannel(channel)}
                    className="accent-accent-primary size-4 rounded border-subtle"
                  />
                </label>
              ))}
            </div>
          </fieldset>

          {supportsThresholdsDays(alertType) && (
            <div className="rounded-md border border-subtle bg-layer-1 p-3">
              <p className="mb-2 text-11 font-medium text-secondary">{t("alert.form.thresholds_days")}</p>
              <DueDateThresholds
                value={config.thresholds_days ?? DEFAULT_THRESHOLDS}
                onChange={(thresholds_days) => patchConfig({ thresholds_days })}
              />
            </div>
          )}

          {supportsGracePeriod(alertType) && (
            <label className="block space-y-1">
              <span className="text-11 font-medium text-secondary">{t("alert.form.grace_period_days")}</span>
              <Input
                type="number"
                min={0}
                value={String(config.grace_period_days ?? 3)}
                onChange={(e) => patchConfig({ grace_period_days: parseInt(e.target.value, 10) || 0 })}
                className="w-24"
              />
            </label>
          )}

          {supportsSlaMinutes(alertType) && (
            <div className="rounded-md border border-subtle bg-layer-1 p-3">
              <p className="mb-2 text-11 font-medium text-secondary">{t("alert.form.thresholds_minutes")}</p>
              <DueDateThresholds
                value={config.thresholds_minutes ?? DEFAULT_SLA_MINUTES}
                onChange={(thresholds_minutes) => patchConfig({ thresholds_minutes })}
              />
            </div>
          )}

          {supportsNotifyToggles(alertType) && (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <label className="flex items-center justify-between rounded-sm border border-subtle bg-surface-1 px-3 py-2">
                <span className="text-13 text-primary">{t("alert.form.notify_assignees")}</span>
                <ToggleSwitch
                  value={config.notify_assignees ?? true}
                  onChange={(notify_assignees) => patchConfig({ notify_assignees })}
                />
              </label>
              <label className="flex items-center justify-between rounded-sm border border-subtle bg-surface-1 px-3 py-2">
                <span className="text-13 text-primary">{t("alert.form.notify_creator")}</span>
                <ToggleSwitch
                  value={config.notify_creator ?? false}
                  onChange={(notify_creator) => patchConfig({ notify_creator })}
                />
              </label>
            </div>
          )}

          {supportsEscalation(alertType) && (
            <div className="rounded-md border border-subtle bg-layer-1 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-11 font-medium text-secondary">{t("alert.form.escalation_schedule")}</p>
                <Button variant="secondary" size="sm" onClick={addEscalationStep}>
                  {t("alert.form.add_escalation")}
                </Button>
              </div>
              {escalationSchedule.length === 0 ? (
                <p className="text-11 text-tertiary">{t("alert.form.escalation_empty")}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {escalationSchedule.map((step, index) => (
                    <div
                      key={`esc-${index}`}
                      className="flex flex-wrap items-center gap-2 rounded-sm border border-subtle bg-surface-1 p-2"
                    >
                      <Input
                        type="number"
                        min={0}
                        value={String(step.days_before)}
                        onChange={(e) =>
                          updateEscalationStep(index, { days_before: parseInt(e.target.value, 10) || 0 })
                        }
                        className="w-16"
                      />
                      <span className="text-11 text-secondary">{t("alert.form.days_before")}</span>
                      {ALL_CHANNELS.map((channel) => (
                        <label key={channel} className="flex items-center gap-1 text-11 text-secondary">
                          <input
                            type="checkbox"
                            checked={step.channels.includes(channel)}
                            onChange={() => {
                              const nextChannels = step.channels.includes(channel)
                                ? step.channels.filter((item) => item !== channel)
                                : [...step.channels, channel];
                              updateEscalationStep(index, { channels: nextChannels });
                            }}
                            className="accent-accent-primary size-3.5"
                          />
                          {t(`alert.channel.${channel}` as "alert.channel.email")}
                        </label>
                      ))}
                      <Button variant="secondary" size="sm" onClick={() => removeEscalationStep(index)}>
                        {t("alert.form.remove_escalation")}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-subtle px-5 py-4">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            {t("cancel")}
          </Button>
          <Button variant="primary" size="sm" loading={saving} onClick={() => void handleSubmit()}>
            {mode === "create" ? t("alert.rules.create") : t("save_changes")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
