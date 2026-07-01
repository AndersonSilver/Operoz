import { memo, useMemo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import clsx from "clsx";
import { Clock3 } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import type { AutomationNodeData } from "./automation-utils";
import { computeNextRun, describeSchedule, formatNextRun, normalizeScheduleConfig } from "./schedule-cron-utils";

export const ScheduleCronFlowNode = memo(function ScheduleCronFlowNode({
  data,
  selected,
}: NodeProps & { data: AutomationNodeData }) {
  const { t, currentLocale } = useTranslation();
  const config = useMemo(() => normalizeScheduleConfig(data.config ?? {}), [data.config]);

  const summary = useMemo(
    () =>
      describeSchedule(config, {
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
    [config, t]
  );

  const nextRun = useMemo(() => computeNextRun(config), [config]);
  const nextRunLabel = formatNextRun(nextRun, currentLocale ?? "pt-BR", config.timezone);

  return (
    <div
      className={clsx(
        "schedule-cron-node shadow-md relative min-w-[248px] overflow-visible rounded-xl border bg-layer-1 transition-all",
        selected && "ring-offset-surface-1 ring-2 ring-[var(--extended-color-indigo-500)] ring-offset-2"
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-90"
        aria-hidden
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--extended-color-indigo-500) 18%, transparent), color-mix(in srgb, var(--extended-color-purple-500) 12%, transparent))",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-xl"
        aria-hidden
        style={{
          padding: "1px",
          background:
            "linear-gradient(120deg, var(--extended-color-indigo-400), var(--extended-color-purple-500), var(--extended-color-indigo-600))",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />

      <Handle
        type="source"
        position={Position.Right}
        className="automation-flow-handle automation-flow-handle-default"
      />

      <div className="relative flex items-start gap-3 px-3.5 py-3">
        <div className="schedule-cron-node-icon shadow-inner flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--extended-color-indigo-500)]/15">
          <Clock3 className="size-5 text-[var(--extended-color-indigo-500)]" strokeWidth={2.25} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="inline-flex rounded-full bg-[var(--extended-color-indigo-500)]/15 px-2 py-0.5 text-10 font-semibold tracking-wide text-[var(--extended-color-indigo-500)] uppercase">
            {t("boards.settings.automation.schedule.node_badge")}
          </span>
          <p className="mt-1 text-14 leading-snug font-semibold text-primary">{data.label}</p>
          <p className="mt-1 text-11 leading-relaxed text-secondary">{summary}</p>
        </div>
      </div>

      <div className="relative border-t border-[var(--extended-color-indigo-500)]/20 px-3.5 py-2.5">
        <p className="text-10 font-medium tracking-wide text-tertiary uppercase">
          {t("boards.settings.automation.schedule.next_run")}
        </p>
        <p className="mt-0.5 text-12 font-semibold text-[var(--extended-color-indigo-500)]">{nextRunLabel}</p>
        <p className="font-mono mt-1 truncate text-10 text-tertiary">{config.timezone}</p>
      </div>
    </div>
  );
});
