import { useMemo } from "react";
import { useTranslation } from "@operis/i18n";
import { ConfigField, ConfigSelect, ConfigTextInput } from "./automation-config-primitives";
import {
  SCHEDULE_TIMEZONE_OPTIONS,
  WEEKDAY_OPTIONS,
  computeNextRun,
  cronExpressionFromConfig,
  describeSchedule,
  formatNextRun,
  normalizeScheduleConfig,
  type ScheduleCronConfig,
  type SchedulePreset,
} from "./schedule-cron-utils";

type Props = {
  config: Record<string, unknown>;
  onChange: (patch: Partial<ScheduleCronConfig>) => void;
};

export function ScheduleCronConfigForm({ config: rawConfig, onChange }: Props) {
  const { t, currentLocale } = useTranslation();
  const config = useMemo(() => normalizeScheduleConfig(rawConfig), [rawConfig]);

  const labels = useMemo(
    () => ({
      daily: t("boards.settings.automation.schedule.preset_daily"),
      weekly: t("boards.settings.automation.schedule.preset_weekly"),
      monthly: t("boards.settings.automation.schedule.preset_monthly"),
      custom: t("boards.settings.automation.schedule.preset_custom"),
      at: t("boards.settings.automation.schedule.at"),
      dayOfMonth: t("boards.settings.automation.schedule.day_of_month_short"),
      weekdays: {
        mon: t("boards.settings.automation.schedule.weekday_mon"),
        tue: t("boards.settings.automation.schedule.weekday_tue"),
        wed: t("boards.settings.automation.schedule.weekday_wed"),
        thu: t("boards.settings.automation.schedule.weekday_thu"),
        fri: t("boards.settings.automation.schedule.weekday_fri"),
        sat: t("boards.settings.automation.schedule.weekday_sat"),
        sun: t("boards.settings.automation.schedule.weekday_sun"),
      },
    }),
    [t]
  );

  const summary = describeSchedule(config, labels);
  const cronExpr = cronExpressionFromConfig(config);
  const nextRun = computeNextRun(config);
  const nextRunLabel = formatNextRun(nextRun, currentLocale ?? "pt-BR", config.timezone);

  const toggleWeekday = (day: number) => {
    const set = new Set(config.weekdays);
    if (set.has(day)) set.delete(day);
    else set.add(day);
    onChange({ weekdays: [...set].sort((a, b) => a - b) });
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[var(--extended-color-indigo-500)]/25 bg-[var(--extended-color-indigo-500)]/5 px-3 py-2.5">
        <p className="text-11 font-medium text-[var(--extended-color-indigo-500)]">{summary}</p>
        <p className="mt-1 text-10 text-tertiary">
          {t("boards.settings.automation.schedule.next_run")}:{" "}
          <span className="font-semibold text-secondary">{nextRunLabel}</span>
        </p>
      </div>

      <ConfigField label={t("boards.settings.automation.schedule.preset")}>
        <ConfigSelect
          value={config.preset}
          onChange={(preset) => onChange({ preset: preset as SchedulePreset })}
          options={[
            { value: "daily", label: t("boards.settings.automation.schedule.preset_daily") },
            { value: "weekly", label: t("boards.settings.automation.schedule.preset_weekly") },
            { value: "monthly", label: t("boards.settings.automation.schedule.preset_monthly") },
            { value: "custom", label: t("boards.settings.automation.schedule.preset_custom") },
          ]}
        />
      </ConfigField>

      {config.preset !== "custom" && (
        <ConfigField label={t("boards.settings.automation.schedule.time")}>
          <ConfigTextInput value={config.time} onChange={(time) => onChange({ time })} placeholder="09:00" />
        </ConfigField>
      )}

      {config.preset === "weekly" && (
        <ConfigField label={t("boards.settings.automation.schedule.weekdays")}>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAY_OPTIONS.map((day) => {
              const active = config.weekdays.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleWeekday(day.value)}
                  className={
                    active
                      ? "rounded-lg border border-[var(--extended-color-indigo-500)] bg-[var(--extended-color-indigo-500)]/15 px-2.5 py-1 text-11 font-medium text-[var(--extended-color-indigo-500)]"
                      : "rounded-lg border border-subtle bg-layer-1 px-2.5 py-1 text-11 text-secondary hover:bg-layer-2"
                  }
                >
                  {t(`boards.settings.automation.schedule.weekday_${day.labelKey}`)}
                </button>
              );
            })}
          </div>
        </ConfigField>
      )}

      {config.preset === "monthly" && (
        <ConfigField label={t("boards.settings.automation.schedule.day_of_month")}>
          <ConfigTextInput
            value={String(config.day_of_month)}
            onChange={(raw) => {
              const n = Number(raw);
              if (!Number.isNaN(n)) onChange({ day_of_month: Math.min(31, Math.max(1, n)) });
            }}
            placeholder="1"
          />
        </ConfigField>
      )}

      {config.preset === "custom" && (
        <ConfigField
          label={t("boards.settings.automation.schedule.cron_expression")}
          hint={t("boards.settings.automation.schedule.cron_hint")}
        >
          <ConfigTextInput value={config.cron} onChange={(cron) => onChange({ cron })} placeholder="0 9 * * *" />
        </ConfigField>
      )}

      <ConfigField label={t("boards.settings.automation.schedule.timezone")}>
        <ConfigSelect
          value={config.timezone}
          onChange={(timezone) => onChange({ timezone })}
          options={SCHEDULE_TIMEZONE_OPTIONS}
        />
      </ConfigField>

      {cronExpr && (
        <p className="font-mono rounded-md border border-subtle bg-layer-1 px-2.5 py-2 text-10 text-tertiary">
          cron: {cronExpr}
        </p>
      )}
    </div>
  );
}
