import { ArrowRight, CheckCircle2, CircleX, Clock, History, Loader2, SkipForward } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import type { IBoardAutomationRun } from "@operis/types";
import { cn } from "@operis/ui";
import { formatRunDurationLabel, getRunDurationMs, splitRunDateTime } from "./automation-history-utils";
import "./automation-list.css";

type StatusKey = IBoardAutomationRun["status"] | "pending";

const STATUS_CONFIG: Record<
  StatusKey,
  {
    card: string;
    accent: string;
    iconWrap: string;
    badge: string;
    icon: typeof CheckCircle2;
  }
> = {
  success: {
    card: "automation-history-card--success",
    accent: "bg-success-primary",
    iconWrap: "border-success-subtle bg-success-subtle/50 text-success-primary",
    badge: "bg-success-subtle text-success-primary",
    icon: CheckCircle2,
  },
  failed: {
    card: "automation-history-card--failed",
    accent: "bg-danger-primary",
    iconWrap: "border-danger-subtle bg-danger-subtle/40 text-danger-primary",
    badge: "bg-danger-subtle text-danger-primary",
    icon: CircleX,
  },
  skipped: {
    card: "automation-history-card--skipped",
    accent: "bg-warning-primary",
    iconWrap: "border-warning-subtle bg-warning-subtle/40 text-warning-primary",
    badge: "bg-warning-subtle text-warning-primary",
    icon: SkipForward,
  },
  pending: {
    card: "automation-history-card--pending",
    accent: "bg-subtle",
    iconWrap: "border-subtle bg-layer-2 text-tertiary",
    badge: "bg-layer-2 text-tertiary",
    icon: Clock,
  },
  running: {
    card: "automation-history-card--running",
    accent: "bg-accent-primary",
    iconWrap: "border-accent-subtle bg-accent-subtle/40 text-accent-primary",
    badge: "bg-accent-subtle text-accent-primary",
    icon: Loader2,
  },
};

function formatEventLabel(eventType: string) {
  return eventType
    .split(".")
    .map((part) => part.replace(/_/g, " "))
    .join(" · ");
}

function TimingCell(props: { label: string; time?: string; date?: string; isRunning?: boolean }) {
  const { label, time, date, isRunning } = props;

  return (
    <div className="automation-history-timing-cell">
      <p className="automation-history-timing-cell__label">{label}</p>
      {isRunning ? (
        <div className="mt-1 flex items-center gap-1.5 text-13 text-placeholder">
          <Loader2 className="size-3.5 animate-spin" strokeWidth={1.75} />
          <span>…</span>
        </div>
      ) : (
        <>
          <p className="automation-history-timing-cell__time">{time ?? "—"}</p>
          <p className="automation-history-timing-cell__date">{date ?? "—"}</p>
        </>
      )}
    </div>
  );
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
    <ul className="flex flex-col gap-3">
      {runs.map((run) => {
        const config = STATUS_CONFIG[run.status] ?? STATUS_CONFIG.pending;
        const StatusIcon = config.icon;
        const statusLabel = t(`boards.settings.automation.history.status.${run.status}`, {
          defaultValue: run.status,
        });

        const start = splitRunDateTime(run.started_at ?? run.created_at);
        const end = splitRunDateTime(run.finished_at);
        const durationMs = getRunDurationMs(run.started_at ?? run.created_at, run.finished_at);
        const durationLabel = durationMs != null ? formatRunDurationLabel(durationMs, t) : null;
        const isRunning = run.status === "running" || (!run.finished_at && run.status === "pending");

        return (
          <li key={run.id}>
            <article className={cn("automation-history-card", config.card)}>
              <span className={cn("automation-history-card__accent", config.accent)} aria-hidden />

              <div className="automation-history-card__body">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl border", config.iconWrap)}>
                      <StatusIcon
                        className={cn("size-5", run.status === "running" && "animate-spin")}
                        strokeWidth={1.75}
                      />
                    </span>
                    <div className="min-w-0">
                      <button
                        type="button"
                        className="text-15 truncate text-left font-semibold text-primary transition-colors hover:text-accent-primary"
                        onClick={() => onSelectRule(run.rule)}
                      >
                        {run.rule_name}
                      </button>
                      <p className="mt-0.5 text-12 text-tertiary">{formatEventLabel(run.event_type)}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-10 font-semibold tracking-wide uppercase",
                        config.badge
                      )}
                    >
                      {statusLabel}
                    </span>
                    <Button variant="secondary" size="sm" onClick={() => onViewDetails(run)}>
                      {t("boards.settings.automation.history.show_details")}
                    </Button>
                  </div>
                </header>

                <div className="automation-history-card__timing">
                  <TimingCell
                    label={t("boards.settings.automation.history.timing_start")}
                    time={start.time}
                    date={start.date}
                  />

                  <div className="automation-history-card__bridge" aria-hidden>
                    <span className="automation-history-card__bridge-line" />
                    {durationLabel ? (
                      <span className="automation-history-card__bridge-pill">{durationLabel}</span>
                    ) : isRunning ? (
                      <span className="automation-history-card__bridge-pill automation-history-card__bridge-pill--muted">
                        {t("boards.settings.automation.history.in_progress")}
                      </span>
                    ) : (
                      <span className="automation-history-card__bridge-dot" />
                    )}
                    <span className="automation-history-card__bridge-line" />
                    <ArrowRight className="automation-history-card__bridge-arrow size-3.5 text-placeholder" />
                  </div>

                  <TimingCell
                    label={t("boards.settings.automation.history.timing_end")}
                    time={end.time}
                    date={end.date}
                    isRunning={isRunning}
                  />

                  <div className="automation-history-card__duration-mobile">
                    <p className="text-10 font-medium tracking-wide text-tertiary uppercase">
                      {t("boards.settings.automation.history.timing_duration")}
                    </p>
                    <p className="mt-0.5 text-14 font-semibold text-primary tabular-nums">
                      {durationLabel ?? (isRunning ? "…" : "—")}
                    </p>
                  </div>
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
