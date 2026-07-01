import { CheckCircle2, CircleX, X } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import type { IBoardAutomationRun, TAutomationGraph } from "@operoz/types";
import { Button } from "@operoz/propel/button";
import { EModalPosition, EModalWidth, ModalCore, cn } from "@operoz/ui";
import { AutomationDryRunTimeline, summarizeSteps } from "./automation-dry-run-timeline";
import { formatRunDateTime, formatRunDurationLabel, getRunDurationMs } from "./automation-history-utils";

type Props = {
  run: IBoardAutomationRun | null;
  graph?: TAutomationGraph;
  isOpen: boolean;
  onClose: () => void;
};

export function AutomationRunDetailModal(props: Props) {
  const { run, graph, isOpen, onClose } = props;
  const { t } = useTranslation();

  if (!run) return null;

  const steps = run.step_logs ?? [];
  const stats = summarizeSteps(steps);
  const allPassed = run.status === "success" && stats.failed === 0;
  const statusTone =
    run.status === "success" && allPassed ? "success" : run.status === "skipped" ? "warning" : "danger";
  const StatusIcon = allPassed ? CheckCircle2 : CircleX;
  const startedAt = formatRunDateTime(run.started_at ?? run.created_at);
  const finishedAt = formatRunDateTime(run.finished_at);
  const durationMs = getRunDurationMs(run.started_at ?? run.created_at, run.finished_at);
  const durationLabel = durationMs != null ? formatRunDurationLabel(durationMs, t) : null;

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.XXXL}>
      <div className="flex max-h-[85vh] flex-col">
        <div className="flex items-start justify-between gap-3 border-b border-subtle px-5 py-3">
          <p className="text-11 font-medium tracking-wide text-tertiary uppercase">
            {t("boards.settings.automation.history.steps_modal_badge")}
          </p>
          <button
            type="button"
            className="rounded-md p-1 text-tertiary hover:bg-layer-1-hover hover:text-primary"
            onClick={onClose}
            aria-label={t("close")}
          >
            <X className="size-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div
            className={cn(
              "relative overflow-hidden rounded-xl border bg-surface-1 p-5",
              statusTone === "success" && "border-success-subtle",
              statusTone === "warning" && "border-warning-subtle",
              statusTone === "danger" && "border-danger-subtle"
            )}
          >
            <div
              className={cn(
                "pointer-events-none absolute -top-8 -right-8 size-32 rounded-full opacity-20 blur-3xl",
                statusTone === "success" && "bg-success-primary",
                statusTone === "warning" && "bg-warning-primary",
                statusTone === "danger" && "bg-danger-primary"
              )}
            />
            <div className="relative flex gap-4">
              <span
                className={cn(
                  "grid size-12 shrink-0 place-items-center rounded-xl border",
                  statusTone === "success" && "border-success-subtle bg-success-subtle/40 text-success-primary",
                  statusTone === "warning" && "border-warning-subtle bg-warning-subtle/30 text-warning-primary",
                  statusTone === "danger" && "border-danger-subtle bg-danger-subtle/30 text-danger-primary"
                )}
              >
                <StatusIcon className="size-6" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-11 font-medium tracking-wide text-tertiary uppercase">
                  {t("boards.settings.automation.dry_run_page.badge_live")}
                </p>
                <h3 className="mt-1 text-18 font-semibold text-primary">{run.rule_name}</h3>
                <div className="mt-2 flex flex-wrap gap-2 text-12 text-tertiary">
                  <span className="font-mono rounded-md border border-subtle bg-layer-1 px-2 py-1 text-11">
                    {run.event_type}
                  </span>
                  {startedAt ? (
                    <span className="rounded-md border border-subtle bg-layer-1 px-2 py-1">
                      {t("boards.settings.automation.history.started_at", { date: startedAt })}
                    </span>
                  ) : null}
                  {finishedAt ? (
                    <span className="rounded-md border border-subtle bg-layer-1 px-2 py-1">
                      {t("boards.settings.automation.history.finished_at", { date: finishedAt })}
                    </span>
                  ) : null}
                  {durationLabel ? (
                    <span className="rounded-md border border-subtle bg-accent-subtle px-2 py-1 text-accent-primary">
                      {t("boards.settings.automation.history.duration", { value: durationLabel })}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {steps.length > 0 && (
              <div className="relative mt-5 grid grid-cols-3 gap-3 border-t border-subtle pt-4">
                {[
                  { label: t("boards.settings.automation.dry_run_page.stat_steps"), value: stats.total },
                  { label: t("boards.settings.automation.dry_run_page.stat_ok"), value: stats.success },
                  { label: t("boards.settings.automation.dry_run_page.stat_failed"), value: stats.failed },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-subtle bg-layer-1 px-3 py-2.5 text-center">
                    <p className="text-20 font-semibold text-primary tabular-nums">{item.value}</p>
                    <p className="mt-0.5 text-11 text-tertiary">{item.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {run.error_message && (
            <p className="mt-4 rounded-md border border-danger-subtle bg-danger-subtle/20 px-3 py-2 text-13 text-danger-primary">
              {run.error_message}
            </p>
          )}

          <section className="mt-5">
            <h2 className="mb-3 text-14 font-semibold text-primary">
              {t("boards.settings.automation.dry_run_page.timeline_title")}
            </h2>
            <AutomationDryRunTimeline steps={steps} graph={graph} />
          </section>
        </div>

        <div className="flex justify-end border-t border-subtle px-5 py-3">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t("close")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
