import { CheckCircle2, CircleX, Clock, History, Loader2, SkipForward } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import type { IBoardAutomationRun } from "@operis/types";
import { cn } from "@operis/ui";
import { renderFormattedDate } from "@operis/utils";

const STATUS_CONFIG: Record<
  string,
  { tone: string; icon: typeof CheckCircle2 }
> = {
  success: { tone: "bg-success-subtle text-success-primary", icon: CheckCircle2 },
  failed: { tone: "bg-danger-subtle text-danger-primary", icon: CircleX },
  skipped: { tone: "bg-warning-subtle text-warning-primary", icon: SkipForward },
  pending: { tone: "bg-layer-2 text-tertiary", icon: Clock },
  running: { tone: "bg-accent-subtle text-accent-primary", icon: Loader2 },
};

function formatEventLabel(eventType: string) {
  return eventType
    .split(".")
    .map((part) => part.replace(/_/g, " "))
    .join(" · ");
}

type Props = {
  runs: IBoardAutomationRun[];
  onSelectRule: (ruleId: string) => void;
  onViewDetails: (run: IBoardAutomationRun) => void;
};

export function AutomationHistoryRunList(props: Props) {
  const { runs, onSelectRule, onViewDetails } = props;
  const { t } = useTranslation();

  return (
    <ul className="flex flex-col gap-2">
      {runs.map((run) => {
        const config = STATUS_CONFIG[run.status] ?? STATUS_CONFIG.pending;
        const StatusIcon = config.icon;
        const statusLabel = t(`boards.settings.automation.history.status.${run.status}`, {
          defaultValue: run.status,
        });

        return (
          <li key={run.id}>
            <article
              className={cn(
                "rounded-xl border border-subtle bg-layer-1 transition-colors",
                "hover:border-strong hover:bg-layer-1-hover"
              )}
            >
              <div className="flex flex-wrap items-start gap-3 p-4">
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-lg border border-subtle",
                    config.tone
                  )}
                >
                  <StatusIcon
                    className={cn("size-4", run.status === "running" && "animate-spin")}
                    strokeWidth={1.75}
                  />
                </span>

                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    className="text-left text-14 font-semibold text-primary hover:underline"
                    onClick={() => onSelectRule(run.rule)}
                  >
                    {run.rule_name}
                  </button>
                  <p className="mt-1 text-12 text-secondary">{formatEventLabel(run.event_type)}</p>
                  <p className="mt-1.5 text-11 text-placeholder">
                    {run.finished_at
                      ? t("boards.settings.automation.history.finished_at", {
                          date: renderFormattedDate(run.finished_at),
                        })
                      : t("boards.settings.automation.history.in_progress")}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-10 font-semibold uppercase tracking-wide",
                      config.tone
                    )}
                  >
                    {statusLabel}
                  </span>
                  <Button variant="secondary" size="sm" onClick={() => onViewDetails(run)}>
                    {t("boards.settings.automation.history.show_details")}
                  </Button>
                </div>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}

export function AutomationHistoryEmptyState() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-subtle bg-layer-1 px-6 py-14 text-center">
      <span className="mb-4 grid size-12 place-items-center rounded-xl border border-subtle bg-layer-2 text-tertiary">
        <History className="size-5" strokeWidth={1.75} />
      </span>
      <p className="text-14 font-semibold text-primary">{t("boards.settings.automation.history.empty")}</p>
      <p className="mt-1.5 max-w-md text-13 leading-relaxed text-tertiary">
        {t("boards.settings.automation.history.empty_hint")}
      </p>
    </div>
  );
}
