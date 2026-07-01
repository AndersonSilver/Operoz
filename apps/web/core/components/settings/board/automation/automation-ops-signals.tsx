import { useMemo, useState } from "react";
import { ChevronDown, Server, ShieldAlert } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { cn } from "@operoz/ui";
import { formatMetricValue, getOperationalSignals, type ParsedAutomationMetric } from "./automation-ops-utils";

type Props = {
  metrics: Record<string, number>;
};

function metricLabel(item: ParsedAutomationMetric, t: (key: string, opts?: { defaultValue?: string }) => string) {
  if (item.reason) {
    return t(`boards.settings.automation.ops.metrics.reasons.${item.reason}`, {
      defaultValue: item.reason,
    });
  }
  return t(`boards.settings.automation.ops.metrics.keys.${item.baseKey}`, {
    defaultValue: item.baseKey,
  });
}

export function AutomationOpsSignals(props: Props) {
  const { metrics } = props;
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const { alerts, info } = useMemo(() => getOperationalSignals(metrics), [metrics]);

  if (alerts.length === 0 && info.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-xl border border-subtle bg-layer-1">
      {alerts.length > 0 ? (
        <div className="border-b border-subtle bg-danger-subtle/30 px-4 py-3 sm:px-5">
          <div className="flex items-start gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-subtle bg-layer-1 text-danger-primary">
              <ShieldAlert className="size-4" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-13 font-semibold text-primary">
                {t("boards.settings.automation.ops.metrics.signals.alerts_title")}
              </h3>
              <p className="mt-0.5 text-12 text-tertiary">
                {t("boards.settings.automation.ops.metrics.signals.alerts_description")}
              </p>
              <ul className="mt-3 divide-y divide-subtle rounded-lg border border-subtle bg-layer-1">
                {alerts.map((item) => (
                  <li key={item.rawKey} className="flex items-center justify-between gap-3 px-3 py-2.5 text-12">
                    <span className="text-secondary">{metricLabel(item, t)}</span>
                    <span className="shrink-0 font-semibold text-danger-primary tabular-nums">
                      {formatMetricValue(item.value, item.baseKey)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      {info.length > 0 ? (
        <div className="px-4 py-3 sm:px-5">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 text-left"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
          >
            <div className="flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-subtle bg-layer-2 text-tertiary">
                <Server className="size-4" strokeWidth={1.75} />
              </span>
              <div>
                <h3 className="text-13 font-semibold text-primary">
                  {t("boards.settings.automation.ops.metrics.signals.technical_title")}
                </h3>
                <p className="text-12 text-tertiary">
                  {t("boards.settings.automation.ops.metrics.signals.technical_description")}
                </p>
              </div>
            </div>
            <ChevronDown className={cn("size-4 shrink-0 text-tertiary transition-transform", open && "rotate-180")} />
          </button>

          {open ? (
            <ul className="mt-3 divide-y divide-subtle rounded-lg border border-subtle bg-surface-1">
              {info.map((item) => (
                <li key={item.rawKey} className="flex items-center justify-between gap-3 px-3 py-2.5 text-12">
                  <span className="text-secondary">{metricLabel(item, t)}</span>
                  <span className="shrink-0 font-medium text-primary tabular-nums">
                    {formatMetricValue(item.value, item.baseKey)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 pl-11 text-12 text-tertiary">
              {info
                .slice(0, 2)
                .map((item) => `${metricLabel(item, t)}: ${formatMetricValue(item.value, item.baseKey)}`)
                .join(" · ")}
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
