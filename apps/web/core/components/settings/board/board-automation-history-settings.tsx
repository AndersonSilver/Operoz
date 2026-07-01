import { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useNavigate } from "react-router";
import { History, Play, RefreshCw, Workflow } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { IBoard, IBoardAutomationRule, IBoardAutomationRun } from "@operoz/types";
import { Loader, cn } from "@operoz/ui";
import { BoardService } from "@/services/board/board.service";
import { AutomationHistoryEmptyState, AutomationHistoryRunList } from "./automation/automation-history-run-list";
import { AutomationRunDetailModal } from "./automation/automation-run-detail-modal";
import { prepareAutomationTestNavigation } from "./automation/automation-test-utils";

const boardService = new BoardService();

export const BoardAutomationHistorySettings = observer(function BoardAutomationHistorySettings(props: {
  workspaceSlug: string;
  board: IBoard;
}) {
  const { workspaceSlug, board } = props;
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [rules, setRules] = useState<IBoardAutomationRule[]>([]);
  const [runs, setRuns] = useState<IBoardAutomationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<string>("");
  const [detailRun, setDetailRun] = useState<IBoardAutomationRun | null>(null);

  const load = useCallback(async () => {
    const [rulesData, runsData] = await Promise.all([
      boardService.getAutomationRules(workspaceSlug, board.slug),
      boardService.getAutomationRuns(workspaceSlug, board.slug),
    ]);
    setRules(rulesData);
    setRuns(runsData);
    setSelectedRuleId((current) => current || rulesData[0]?.id || "");
    return { rulesData, runsData };
  }, [workspaceSlug, board.slug]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void load();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load()
      .catch(() => {
        if (cancelled) return;
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: t("something_went_wrong"),
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load estável por workspaceSlug/board.slug
  }, [workspaceSlug, board.slug]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const selectedRule = useMemo(() => rules.find((rule) => rule.id === selectedRuleId) ?? null, [rules, selectedRuleId]);

  const handleTest = () => {
    if (!selectedRule) return;
    const href = prepareAutomationTestNavigation({
      workspaceSlug,
      board,
      rule: selectedRule,
      from: "historico",
    });
    navigate(href);
  };

  if (loading) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-2 text-13 text-tertiary">
        <Loader />
        {t("loading")}
      </div>
    );
  }

  return (
    <>
      <AutomationRunDetailModal
        run={detailRun}
        graph={rules.find((rule) => rule.id === detailRun?.rule)?.graph}
        isOpen={detailRun !== null}
        onClose={() => setDetailRun(null)}
      />

      <div className="space-y-5">
        <p className="max-w-2xl text-13 leading-relaxed text-tertiary">
          {t("boards.settings.automation.history.lead")}
        </p>

        <section className="overflow-hidden rounded-xl border border-subtle bg-layer-1">
          <div className="flex items-start gap-4 p-4 sm:p-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-subtle bg-accent-subtle text-accent-primary">
              <Play className="size-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-14 font-semibold text-primary">
                {t("boards.settings.automation.history.test_panel_title")}
              </h2>
              <p className="mt-1 text-13 leading-relaxed text-tertiary">
                {t("boards.settings.automation.history.test_panel_description")}
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="min-w-0 flex-1">
                  <span className="text-11 font-medium text-secondary">
                    {t("boards.settings.automation.history.select_rule")}
                  </span>
                  <div className="relative mt-1.5">
                    <Workflow className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-placeholder" />
                    <select
                      className="w-full appearance-none rounded-lg border border-subtle bg-surface-1 py-2.5 pr-3 pl-8 text-13 text-primary"
                      value={selectedRuleId}
                      onChange={(e) => setSelectedRuleId(e.target.value)}
                      disabled={!rules.length}
                    >
                      {rules.length === 0 ? (
                        <option value="">{t("boards.settings.automation.history.no_rules")}</option>
                      ) : (
                        rules.map((rule) => (
                          <option key={rule.id} value={rule.id}>
                            {rule.name}
                            {!rule.enabled ? ` (${t("boards.settings.automation.history.disabled")})` : ""}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </label>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!selectedRule}
                  onClick={handleTest}
                  prependIcon={<Play />}
                  className="shrink-0"
                >
                  {t("boards.settings.automation.dry_run")}
                </Button>
              </div>

              {selectedRule && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-10 font-semibold tracking-wide uppercase",
                      selectedRule.enabled ? "bg-success-subtle text-success-primary" : "bg-layer-2 text-tertiary"
                    )}
                  >
                    {selectedRule.enabled
                      ? t("boards.settings.automation.rules_list.status_active")
                      : t("boards.settings.automation.rules_list.status_inactive")}
                  </span>
                  {!selectedRule.enabled && (
                    <p className="text-11 text-warning-primary">
                      {t("boards.settings.automation.history.disabled_hint")}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <History className="size-4 text-tertiary" strokeWidth={1.75} />
              <h2 className="text-14 font-semibold text-primary">{t("boards.settings.automation.history.title")}</h2>
              <span className="rounded-full bg-layer-2 px-2 py-0.5 text-11 text-tertiary">{runs.length}</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={refreshing}
              onClick={handleRefresh}
              prependIcon={<RefreshCw className={cn(refreshing && "animate-spin")} />}
            >
              {refreshing ? t("loading") : t("boards.settings.automation.history.refresh")}
            </Button>
          </div>

          {runs.length === 0 ? (
            <AutomationHistoryEmptyState />
          ) : (
            <AutomationHistoryRunList
              runs={runs}
              onSelectRule={setSelectedRuleId}
              onViewDetails={(run) => {
                setSelectedRuleId(run.rule);
                setDetailRun(run);
              }}
            />
          )}
        </section>
      </div>
    </>
  );
});
