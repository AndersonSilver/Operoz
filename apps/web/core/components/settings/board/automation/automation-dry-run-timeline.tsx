import { Code2, Filter, GitBranch, Loader2, Mail, Play, Shield, Terminal, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import type { TAutomationGraph } from "@operoz/types";
import { cn } from "@operoz/ui";

const CATALOG_LABEL_FALLBACK: Record<string, string> = {
  "action.run_script": "Executar script",
  "action.send_email": "Enviar e-mail",
  "action.set_field": "Definir campo",
  "action.add_comment": "Adicionar comentário",
  "action.webhook": "Webhook",
  "action.notify": "Notificar membros",
};

export function stepCatalogKey(
  graph: TAutomationGraph | undefined,
  nodeId: string,
  step: Record<string, unknown>
): string {
  if (graph) {
    const fromGraph = graph.nodes.find((n) => n.id === nodeId)?.data.catalog_key;
    if (fromGraph) return fromGraph;
  }
  return String(step.key ?? "");
}

export function stepNodeLabel(
  graph: TAutomationGraph | undefined,
  nodeId: string,
  step: Record<string, unknown>
): string {
  if (graph) {
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (node?.data.label) return node.data.label;
  }
  const catalogKey = stepCatalogKey(graph, nodeId, step);
  if (catalogKey && CATALOG_LABEL_FALLBACK[catalogKey]) {
    return CATALOG_LABEL_FALLBACK[catalogKey];
  }
  if (catalogKey) return catalogKey;
  return nodeId;
}

export function kindIcon(kind: string, catalogKey: string): LucideIcon {
  if (kind === "hook" || kind === "policy") return Shield;
  if (catalogKey === "action.send_email") return Mail;
  if (catalogKey === "action.run_script") return Terminal;
  if (kind === "trigger") return Zap;
  if (kind === "filter") return Filter;
  if (kind === "decision") return GitBranch;
  if (kind === "parallel") return GitBranch;
  if (kind === "action") return Play;
  return Code2;
}

export function summarizeSteps(steps: Record<string, unknown>[]) {
  let success = 0;
  let failed = 0;
  for (const step of steps) {
    const kind = String(step.kind ?? "");
    const isFilter = kind === "filter";
    const passed = isFilter ? step.passed === true : step.ok !== false && step.passed !== false;
    if (passed) success += 1;
    else failed += 1;
  }
  return { total: steps.length, success, failed };
}

type Props = {
  steps: Record<string, unknown>[];
  graph?: TAutomationGraph;
  isRunning?: boolean;
};

export function AutomationDryRunTimeline(props: Props) {
  const { steps, graph, isRunning } = props;
  const { t } = useTranslation();

  if (steps.length === 0 && isRunning) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-subtle bg-layer-1 p-4">
        <Loader2 className="size-4 animate-spin text-accent-primary" />
        <p className="text-13 text-secondary">{t("boards.settings.automation.dry_run_page.running_wait")}</p>
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <p className="rounded-lg border border-subtle bg-layer-1 p-4 text-13 text-tertiary">
        {t("boards.settings.automation.dry_run_panel.no_steps")}
      </p>
    );
  }

  return (
    <ol className="relative space-y-0">
      {steps.map((step, index) => {
        const nodeId = String(step.node_id ?? "");
        const kind = String(step.kind ?? "");
        const catalogKey = stepCatalogKey(graph, nodeId, step);
        const Icon = kindIcon(kind, catalogKey);
        const isHook = kind === "hook";
        const isPolicy = kind === "policy";
        const isFilter = kind === "filter";
        const ok = step.ok !== false && step.passed !== false;
        const passed = isFilter ? step.passed === true : ok;
        const branchTaken = step.branch_taken as string | undefined;
        const message = step.message as string | undefined;
        const hint = step.hint as string | undefined;
        const raw = step.raw as string | undefined;
        const logs = step.logs as string[] | undefined;
        const scriptResult = step.result;
        const isLast = index === steps.length - 1;

        return (
          <li key={`${nodeId}-${index}`} className="relative flex gap-4 pb-6">
            {!isLast && (
              <span
                className={cn(
                  "absolute top-10 bottom-0 left-[1.125rem] w-px",
                  passed ? "bg-success-subtle" : "bg-danger-subtle"
                )}
                aria-hidden
              />
            )}
            <span
              className={cn(
                "relative z-10 grid size-9 shrink-0 place-items-center rounded-full border-2 bg-surface-1",
                passed ? "border-success-primary text-success-primary" : "border-danger-primary text-danger-primary"
              )}
            >
              <Icon className="size-4" strokeWidth={1.75} />
            </span>
            <article
              className={cn(
                "min-w-0 flex-1 rounded-lg border bg-layer-1 p-4",
                passed ? "border-subtle" : "border-danger-subtle"
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-11 font-medium tracking-wide text-tertiary uppercase">
                    {t("boards.settings.automation.dry_run_page.step_label", { index: index + 1 })}
                  </p>
                  <h3 className="mt-0.5 text-14 font-semibold text-primary">
                    {isHook
                      ? String(step.hook_name ?? t("boards.settings.automation.hooks.step_label"))
                      : isPolicy
                        ? t("boards.settings.automation.policy.step_label")
                        : stepNodeLabel(graph, nodeId, step)}
                  </h3>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-11 font-semibold uppercase",
                    passed ? "bg-success-subtle text-success-primary" : "bg-danger-subtle text-danger-primary"
                  )}
                >
                  {passed
                    ? t("boards.settings.automation.dry_run_panel.branch_success")
                    : t("boards.settings.automation.dry_run_panel.branch_error")}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded bg-layer-2 px-1.5 py-0.5 text-10 tracking-wide text-tertiary uppercase">
                  {kind}
                </span>
                {catalogKey && (
                  <span className="font-mono rounded bg-layer-2 px-1.5 py-0.5 text-10 text-tertiary">{catalogKey}</span>
                )}
                {typeof step.iteration === "number" && (
                  <span className="rounded bg-layer-2 px-1.5 py-0.5 text-10 text-tertiary">
                    {t("boards.settings.automation.retry.iteration_badge", {
                      current: step.iteration,
                      max: step.max_iterations ?? "?",
                    })}
                  </span>
                )}
                {typeof step.parallel_branch_index === "number" && (
                  <span className="rounded bg-layer-2 px-1.5 py-0.5 text-10 text-tertiary">
                    {t("boards.settings.automation.parallel.branch_badge", {
                      index: Number(step.parallel_branch_index) + 1,
                    })}
                  </span>
                )}
                {branchTaken && (
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-10 font-medium uppercase",
                      branchTaken === "success"
                        ? "bg-success-subtle/60 text-success-primary"
                        : "bg-danger-subtle/60 text-danger-primary"
                    )}
                  >
                    {branchTaken === "success"
                      ? t("boards.settings.automation.dry_run_page.branch_taken_success")
                      : t("boards.settings.automation.dry_run_page.branch_taken_error")}
                  </span>
                )}
              </div>

              {message && <p className="mt-3 text-13 text-secondary">{message}</p>}
              {hint && <p className="mt-1 text-12 text-tertiary">{hint}</p>}

              {logs && logs.length > 0 && (
                <div className="mt-3 rounded-md border border-subtle bg-canvas px-3 py-2">
                  <p className="text-10 font-medium tracking-wide text-tertiary uppercase">console</p>
                  <p className="font-mono mt-1 text-11 text-secondary">{logs.join("\n")}</p>
                </div>
              )}

              {raw && (
                <pre className="font-mono mt-3 max-h-32 overflow-auto rounded-md border border-subtle bg-canvas px-3 py-2 text-11 text-tertiary">
                  {raw}
                </pre>
              )}

              {scriptResult !== undefined && (
                <details className="group mt-3">
                  <summary className="cursor-pointer text-12 font-medium text-accent-primary hover:underline">
                    {t("boards.settings.automation.dry_run_page.view_script_output")}
                  </summary>
                  <pre className="font-mono mt-2 max-h-48 overflow-auto rounded-md border border-subtle bg-canvas px-3 py-2 text-11 text-tertiary">
                    {JSON.stringify(scriptResult, null, 2)}
                  </pre>
                </details>
              )}
            </article>
          </li>
        );
      })}
      {isRunning && (
        <li className="relative flex gap-4 pb-2">
          {steps.length > 0 && (
            <span className="absolute top-0 left-[1.125rem] h-4 w-px bg-accent-subtle" aria-hidden />
          )}
          <span className="border-accent-primary relative z-10 grid size-9 shrink-0 place-items-center rounded-full border-2 bg-surface-1 text-accent-primary">
            <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
          </span>
          <article className="min-w-0 flex-1 rounded-lg border border-accent-subtle bg-layer-1 p-4">
            <p className="text-13 font-medium text-accent-primary">
              {t("boards.settings.automation.dry_run_page.running_next_step")}
            </p>
          </article>
        </li>
      )}
    </ol>
  );
}
