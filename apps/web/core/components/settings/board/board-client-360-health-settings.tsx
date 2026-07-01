import useSWR from "swr";
import { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@operoz/i18n";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { IBoard, IBoardClient360HealthSettings } from "@operoz/types";
import { Button } from "@operoz/propel/button";
import { Loader } from "@operoz/ui";
import { defaultWeekPeriod } from "@/components/board/client-360/client-360-utils";
import { BoardClient360HealthPreviewPanel } from "@/components/settings/board/board-client-360-health-preview";
import { BoardClient360IntakeTypesPanel } from "@/components/settings/board/board-client-360-intake-types-panel";
import { BoardService } from "@/services/board/board.service";

const boardService = new BoardService();

function weightsSum(weights: IBoardClient360HealthSettings["weights"]) {
  return weights.report + weights.overdue + weights.support;
}

function cloneSettings(data: IBoardClient360HealthSettings): IBoardClient360HealthSettings {
  return {
    ...data,
    weights: { ...data.weights },
    thresholds: { ...data.thresholds },
  };
}

export const BoardClient360HealthSettingsPanel = observer(function BoardClient360HealthSettingsPanel(props: {
  workspaceSlug: string;
  board: IBoard;
}) {
  const { workspaceSlug, board } = props;
  const { t } = useTranslation();
  const [settings, setSettings] = useState<IBoardClient360HealthSettings | null>(null);
  const [baseline, setBaseline] = useState<IBoardClient360HealthSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const period = useMemo(() => defaultWeekPeriod(), []);

  const { data: client360Data } = useSWR(
    workspaceSlug && board.slug
      ? `CLIENT_360_HEALTH_PREVIEW_${workspaceSlug}_${board.slug}_${period.start}_${period.end}`
      : null,
    () =>
      boardService.getClient360(workspaceSlug, board.slug, {
        period_start: period.start,
        period_end: period.end,
      })
  );

  const { data: reminderLogs } = useSWR(
    workspaceSlug && board.slug ? `CLIENT_360_REMINDER_LOGS_${workspaceSlug}_${board.slug}` : null,
    () => boardService.getClient360ReminderLogs(workspaceSlug, board.slug),
    { revalidateOnFocus: false }
  );

  const load = useCallback(async () => {
    const data = await boardService.getClient360HealthSettings(workspaceSlug, board.slug);
    const snapshot = cloneSettings(data);
    setSettings(snapshot);
    setBaseline(cloneSettings(data));
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
  }, [load, t]);

  const weightTotal = useMemo(() => (settings ? weightsSum(settings.weights) : 100), [settings]);
  const weightsValid = weightTotal === 100;
  const thresholdsValid = settings != null && settings.thresholds.warning_min < settings.thresholds.ok_min;
  const hasDraftChanges = useMemo(() => {
    if (!settings || !baseline) return false;
    return JSON.stringify(settings) !== JSON.stringify(baseline);
  }, [baseline, settings]);

  const handleWeightChange = (key: keyof IBoardClient360HealthSettings["weights"], raw: string) => {
    if (!settings) return;
    const parsed = Number.parseInt(raw, 10);
    const value = Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 0;
    setSettings({
      ...settings,
      weights: { ...settings.weights, [key]: value },
    });
  };

  const handleThresholdChange = (key: keyof IBoardClient360HealthSettings["thresholds"], raw: string) => {
    if (!settings) return;
    const parsed = Number.parseInt(raw, 10);
    const value = Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 0;
    setSettings({
      ...settings,
      thresholds: { ...settings.thresholds, [key]: value },
    });
  };

  const handleScoreAlertThresholdChange = (raw: string) => {
    if (!settings) return;
    const parsed = Number.parseInt(raw, 10);
    const value = Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 0;
    setSettings({
      ...settings,
      score_alert_threshold: value,
    });
  };

  const handleSupportSlaDaysChange = (raw: string) => {
    if (!settings) return;
    const parsed = Number.parseInt(raw, 10);
    const value = Number.isFinite(parsed) ? Math.max(1, Math.min(90, parsed)) : 7;
    setSettings({
      ...settings,
      support_sla_days: value,
    });
  };

  const handleCancelDraft = () => {
    if (!baseline) return;
    setSettings(cloneSettings(baseline));
  };

  const handleSave = async () => {
    if (!settings || !weightsValid || !thresholdsValid) return;
    setSaving(true);
    try {
      const updated = await boardService.updateClient360HealthSettings(workspaceSlug, board.slug, {
        weights: settings.weights,
        thresholds: settings.thresholds,
        score_alert_threshold: settings.score_alert_threshold,
        status_report_reminder_enabled: settings.status_report_reminder_enabled,
        status_report_reminder_email: settings.status_report_reminder_email,
        support_sla_days: settings.support_sla_days,
      });
      const snapshot = cloneSettings(updated);
      setSettings(snapshot);
      setBaseline(snapshot);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.settings.client_360_health.save_success"),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const defaults = await boardService.resetClient360HealthSettings(workspaceSlug, board.slug);
      const snapshot = cloneSettings(defaults);
      setSettings(snapshot);
      setBaseline(snapshot);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.settings.client_360_health.reset_success"),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setResetting(false);
    }
  };

  if (loading || !settings || !baseline) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-2 text-13 text-tertiary">
        <Loader />
        {t("loading")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-16 font-semibold text-primary">{t("boards.settings.client_360_health.title")}</h2>
        <p className="mt-1 text-13 text-secondary">{t("boards.settings.client_360_health.subtitle")}</p>
        {!settings.is_custom ? (
          <p className="mt-2 text-12 text-tertiary">{t("boards.settings.client_360_health.using_defaults")}</p>
        ) : null}
      </div>

      <div className="space-y-4 rounded-lg border border-subtle bg-layer-1 p-4">
        <h3 className="text-14 font-medium text-primary">{t("boards.settings.client_360_health.weights_title")}</h3>
        <p className="text-12 text-secondary">{t("boards.settings.client_360_health.weights_hint")}</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {(["report", "overdue", "support"] as const).map((key) => (
            <label key={key} className="block text-12 text-secondary">
              {t(`boards.settings.client_360_health.weight_${key}`)}
              <input
                type="range"
                min={0}
                max={100}
                className="accent-accent-primary mt-2 w-full"
                value={settings.weights[key]}
                onChange={(e) => handleWeightChange(key, e.target.value)}
              />
              <input
                type="number"
                min={0}
                max={100}
                className="mt-2 w-full rounded-md border border-subtle bg-layer-2 px-3 py-2 text-13 text-primary"
                value={settings.weights[key]}
                onChange={(e) => handleWeightChange(key, e.target.value)}
              />
            </label>
          ))}
        </div>
        <p className={`text-12 ${weightsValid ? "text-tertiary" : "text-danger-primary"}`}>
          {t("boards.settings.client_360_health.weights_sum", { sum: weightTotal })}
        </p>
      </div>

      <BoardClient360HealthPreviewPanel
        clients={client360Data?.clients ?? []}
        baseline={baseline}
        draft={settings}
        weightsValid={weightsValid}
      />

      <div className="space-y-4 rounded-lg border border-subtle bg-layer-1 p-4">
        <h3 className="text-14 font-medium text-primary">{t("boards.settings.client_360_health.thresholds_title")}</h3>
        <p className="text-12 text-secondary">{t("boards.settings.client_360_health.thresholds_hint")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-12 text-secondary">
            {t("boards.settings.client_360_health.threshold_ok")}
            <input
              type="number"
              min={0}
              max={100}
              className="mt-1 w-full rounded-md border border-subtle bg-layer-2 px-3 py-2 text-13 text-primary"
              value={settings.thresholds.ok_min}
              onChange={(e) => handleThresholdChange("ok_min", e.target.value)}
            />
          </label>
          <label className="block text-12 text-secondary">
            {t("boards.settings.client_360_health.threshold_warning")}
            <input
              type="number"
              min={0}
              max={100}
              className="mt-1 w-full rounded-md border border-subtle bg-layer-2 px-3 py-2 text-13 text-primary"
              value={settings.thresholds.warning_min}
              onChange={(e) => handleThresholdChange("warning_min", e.target.value)}
            />
          </label>
        </div>
        {!thresholdsValid ? (
          <p className="text-12 text-danger-primary">{t("boards.settings.client_360_health.thresholds_invalid")}</p>
        ) : null}
      </div>

      <div className="space-y-4 rounded-lg border border-subtle bg-layer-1 p-4">
        <h3 className="text-14 font-medium text-primary">
          {t("boards.settings.client_360_health.score_alert_threshold")}
        </h3>
        <p className="text-12 text-secondary">{t("boards.settings.client_360_health.score_alert_threshold_hint")}</p>
        <label className="block max-w-xs text-12 text-secondary">
          {t("boards.settings.client_360_health.score_alert_threshold")}
          <input
            type="number"
            min={0}
            max={100}
            className="mt-1 w-full rounded-md border border-subtle bg-layer-2 px-3 py-2 text-13 text-primary"
            value={settings.score_alert_threshold}
            onChange={(e) => handleScoreAlertThresholdChange(e.target.value)}
          />
        </label>
      </div>

      <div className="space-y-4 rounded-lg border border-subtle bg-layer-1 p-4">
        <h3 className="text-14 font-medium text-primary">{t("boards.settings.client_360_health.support_sla_title")}</h3>
        <p className="text-12 text-secondary">{t("boards.settings.client_360_health.support_sla_hint")}</p>
        <label className="block max-w-xs text-12 text-secondary">
          {t("boards.settings.client_360_health.support_sla_days")}
          <input
            type="number"
            min={1}
            max={90}
            className="mt-1 w-full rounded-md border border-subtle bg-layer-2 px-3 py-2 text-13 text-primary"
            value={settings.support_sla_days}
            onChange={(e) => handleSupportSlaDaysChange(e.target.value)}
          />
        </label>
      </div>

      <BoardClient360IntakeTypesPanel workspaceSlug={workspaceSlug} board={board} />

      <div className="space-y-4 rounded-lg border border-subtle bg-layer-1 p-4">
        <h3 className="text-14 font-medium text-primary">{t("boards.settings.client_360_health.reminder_title")}</h3>
        <p className="text-12 text-secondary">{t("boards.settings.client_360_health.reminder_hint")}</p>
        <label className="flex items-center gap-2 text-13 text-primary">
          <input
            type="checkbox"
            className="accent-accent-primary size-4"
            checked={settings.status_report_reminder_enabled}
            onChange={(e) => setSettings({ ...settings, status_report_reminder_enabled: e.target.checked })}
          />
          {t("boards.settings.client_360_health.reminder_enabled")}
        </label>
        <label className="flex items-center gap-2 text-13 text-primary">
          <input
            type="checkbox"
            className="accent-accent-primary size-4"
            checked={settings.status_report_reminder_email}
            disabled={!settings.status_report_reminder_enabled}
            onChange={(e) => setSettings({ ...settings, status_report_reminder_email: e.target.checked })}
          />
          {t("boards.settings.client_360_health.reminder_email")}
        </label>
        {reminderLogs && reminderLogs.length > 0 ? (
          <div className="mt-2 space-y-2 border-t border-subtle pt-3">
            <p className="text-12 font-medium text-secondary">
              {t("boards.settings.client_360_health.reminder_logs_title")}
            </p>
            <ul className="max-h-40 space-y-1 overflow-y-auto text-12 text-tertiary">
              {reminderLogs.slice(0, 10).map((log) => (
                <li key={log.id}>
                  {log.period_start} —{" "}
                  {t("boards.settings.client_360_health.reminder_log_line", {
                    notified: log.notified_count,
                    skipped: log.skipped_count,
                  })}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={handleSave} disabled={saving || !weightsValid || !thresholdsValid}>
          {saving ? t("saving") : t("boards.settings.client_360_health.publish")}
        </Button>
        {hasDraftChanges ? (
          <Button variant="secondary" onClick={handleCancelDraft}>
            {t("boards.settings.client_360_health.cancel_draft")}
          </Button>
        ) : null}
        {settings.is_custom ? (
          <Button variant="secondary" onClick={handleReset} disabled={resetting}>
            {resetting ? t("loading") : t("boards.settings.client_360_health.reset_defaults")}
          </Button>
        ) : null}
      </div>
    </div>
  );
});
