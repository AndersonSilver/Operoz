import { AlertTriangle, ArrowLeft, CheckCircle2, CircleX, Loader2, RotateCcw } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import type { TAutomationDryRunResult, TAutomationGraph } from "@operoz/types";
import { Button } from "@operoz/propel/button";
import { cn } from "@operoz/ui";
import { renderFormattedDate } from "@operoz/utils";
import { AutomationDryRunTimeline, summarizeSteps } from "./automation-dry-run-timeline";

type Props = {
  ruleName: string;
  graph: TAutomationGraph;
  result: TAutomationDryRunResult;
  simulatedAt: string;
  onBack: () => void;
  onRerun?: () => void;
  rerunning?: boolean;
  backLabel?: string;
  isRunning?: boolean;
};

export function BoardAutomationDryRunView(props: Props) {
  const { ruleName, graph, result, simulatedAt, onBack, onRerun, rerunning, backLabel, isRunning } = props;
  const { t } = useTranslation();

  const stats = summarizeSteps(result.steps);
  const runFailed = !isRunning && Boolean(result.error) && !result.matched && result.steps.length === 0;
  const allPassed = !isRunning && result.matched && result.passed_filters !== false && stats.failed === 0;
  const blocked = !isRunning && result.matched && result.passed_filters === false;
  const notMatched = !isRunning && !result.matched && !runFailed;

  const StatusIcon = isRunning
    ? Loader2
    : runFailed
      ? CircleX
      : notMatched
        ? AlertTriangle
        : blocked
          ? CircleX
          : allPassed
            ? CheckCircle2
            : CircleX;
  const statusTone = isRunning
    ? "accent"
    : runFailed
      ? "danger"
      : notMatched
        ? "warning"
        : blocked || stats.failed > 0
          ? "danger"
          : "success";

  const statusTitle = isRunning
    ? t("boards.settings.automation.dry_run_page.running_title")
    : runFailed
      ? t("boards.settings.automation.dry_run_page.failed_title")
      : notMatched
        ? t("boards.settings.automation.dry_run_page.not_matched_title")
        : blocked
          ? t("boards.settings.automation.dry_run_page.blocked_title")
          : stats.failed > 0
            ? t("boards.settings.automation.dry_run_page.partial_title")
            : t("boards.settings.automation.dry_run_page.success_title");

  const isLive = result.live !== false;
  const isScheduleTrigger = graph.nodes?.some(
    (node) => node.data.kind === "trigger" && node.data.catalog_key === "schedule.cron"
  );

  const statusDescription = isRunning
    ? t("boards.settings.automation.dry_run_page.running_description")
    : notMatched
      ? isScheduleTrigger
        ? t("boards.settings.automation.dry_run_page.schedule_test_hint")
        : (result.message ?? result.error ?? t("boards.settings.automation.dry_run_panel.not_matched_hint"))
      : blocked
        ? t("boards.settings.automation.dry_run_panel.filters_blocked")
        : isLive
          ? t("boards.settings.automation.dry_run_page.completed_live")
          : t("boards.settings.automation.dry_run_panel.completed");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-10">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="link" size="sm" onClick={onBack} prependIcon={<ArrowLeft />}>
          {backLabel ?? t("boards.settings.automation.dry_run_page.back_to_editor")}
        </Button>
        {onRerun && (
          <Button variant="secondary" size="sm" disabled={rerunning} onClick={onRerun} prependIcon={<RotateCcw />}>
            {rerunning ? t("loading") : t("boards.settings.automation.dry_run_page.rerun")}
          </Button>
        )}
      </div>

      <div
        className={cn(
          "relative overflow-hidden rounded-xl border bg-surface-1 p-6",
          statusTone === "success" && "border-success-subtle",
          statusTone === "warning" && "border-warning-subtle",
          statusTone === "danger" && "border-danger-subtle",
          statusTone === "accent" && "border-accent-subtle"
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute -top-8 -right-8 size-40 rounded-full opacity-20 blur-3xl",
            statusTone === "success" && "bg-success-primary",
            statusTone === "warning" && "bg-warning-primary",
            statusTone === "danger" && "bg-danger-primary",
            statusTone === "accent" && "bg-accent-primary"
          )}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
          <span
            className={cn(
              "grid size-14 shrink-0 place-items-center rounded-xl border",
              statusTone === "success" && "border-success-subtle bg-success-subtle/40 text-success-primary",
              statusTone === "warning" && "border-warning-subtle bg-warning-subtle/30 text-warning-primary",
              statusTone === "danger" && "border-danger-subtle bg-danger-subtle/30 text-danger-primary",
              statusTone === "accent" && "border-accent-subtle bg-accent-subtle/30 text-accent-primary"
            )}
          >
            <StatusIcon className={cn("size-7", isRunning && "animate-spin")} strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-11 font-medium tracking-wide text-tertiary uppercase">
              {isLive
                ? t("boards.settings.automation.dry_run_page.badge_live")
                : t("boards.settings.automation.dry_run_page.badge")}
            </p>
            <h1 className="mt-1 text-20 font-semibold text-primary">{statusTitle}</h1>
            <p className="mt-1 text-13 text-secondary">{statusDescription}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-12 text-tertiary">
              <span className="rounded-md border border-subtle bg-layer-1 px-2 py-1">
                {t("boards.settings.automation.dry_run_page.rule_label")}:{" "}
                <span className="font-medium text-primary">{ruleName}</span>
              </span>
              <span className="rounded-md border border-subtle bg-layer-1 px-2 py-1">
                {renderFormattedDate(simulatedAt)}
              </span>
              {result.test_issue_name && (
                <span className="rounded-md border border-subtle bg-layer-1 px-2 py-1">
                  {t("boards.settings.automation.dry_run_page.test_card")}:{" "}
                  <span className="font-medium text-primary">{result.test_issue_name}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {result.matched && !isRunning && (
          <div className="relative mt-6 grid grid-cols-3 gap-3 border-t border-subtle pt-5">
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

      {(result.matched || isRunning) && (
        <section>
          <h2 className="mb-3 text-14 font-semibold text-primary">
            {t("boards.settings.automation.dry_run_page.timeline_title")}
          </h2>
          <AutomationDryRunTimeline steps={result.steps} graph={graph} isRunning={isRunning} />
        </section>
      )}
    </div>
  );
}
