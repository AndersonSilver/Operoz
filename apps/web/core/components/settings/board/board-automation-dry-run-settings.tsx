import { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "@operis/i18n";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { IBoard, TAutomationDryRunResult } from "@operis/types";
import {
  loadAutomationDryRunSession,
  saveAutomationDryRunSession,
  type TAutomationDryRunSession,
} from "./automation/automation-dry-run-storage";
import { BoardAutomationDryRunView } from "./automation/board-automation-dry-run-view";
import { runAutomationTestStream } from "./automation/automation-test-utils";

export const BoardAutomationDryRunSettings = observer(function BoardAutomationDryRunSettings(props: {
  workspaceSlug: string;
  board: IBoard;
}) {
  const { workspaceSlug, board } = props;
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const ruleId = searchParams.get("ruleId") ?? "";
  const shouldRun = searchParams.get("run") === "1";

  const [session, setSession] = useState<TAutomationDryRunSession | null>(null);
  const [liveSteps, setLiveSteps] = useState<Record<string, unknown>[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [liveResult, setLiveResult] = useState<TAutomationDryRunResult | null>(null);
  const runStartedRef = useRef(false);

  const from = searchParams.get("from");
  const editorHref = `/${workspaceSlug}/settings/boards/${board.slug}/automacao${ruleId ? `?rule=${ruleId}` : ""}`;
  const historyHref = `/${workspaceSlug}/settings/boards/${board.slug}/automacao/historico`;

  const handleBack = useCallback(() => {
    navigate(from === "historico" ? historyHref : editorHref);
  }, [navigate, from, historyHref, editorHref]);

  const clearRunParam = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("run");
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const startStream = useCallback(
    async (baseSession: TAutomationDryRunSession) => {
      setIsRunning(true);
      setLiveSteps([]);
      setLiveResult(null);

      const runningSession: TAutomationDryRunSession = {
        ...baseSession,
        status: "running",
        liveSteps: [],
      };
      saveAutomationDryRunSession(runningSession);
      setSession(runningSession);

      try {
        await runAutomationTestStream(
          {
            workspaceSlug,
            board,
            rule: {
              id: baseSession.ruleId,
              name: baseSession.ruleName,
              graph: baseSession.graph,
            },
            ruleName: baseSession.ruleName,
            graph: baseSession.graph,
          },
          {
            onStep: (step) => {
              setLiveSteps((prev) => {
                const next = [...prev, step];
                saveAutomationDryRunSession({
                  ...runningSession,
                  status: "running",
                  liveSteps: next,
                });
                return next;
              });
            },
            onDone: (result) => {
              setLiveResult(result);
              setLiveSteps(result.steps ?? []);
              const completed: TAutomationDryRunSession = {
                ...baseSession,
                status: "completed",
                result,
                liveSteps: result.steps ?? [],
                simulatedAt: new Date().toISOString(),
              };
              saveAutomationDryRunSession(completed);
              setSession(completed);
            },
            onError: (message, code) => {
              if (code === "no_issue") {
                setToast({
                  type: TOAST_TYPE.ERROR,
                  title: t("toast.error"),
                  message: t("boards.settings.automation.dry_run_page.no_issue"),
                });
              }
            },
          }
        );
      } catch (err: unknown) {
        const data = (err as { code?: string; error?: string }) ?? {};
        const failed: TAutomationDryRunSession = {
          ...baseSession,
          status: "failed",
          error: data.error ?? t("something_went_wrong"),
        };
        saveAutomationDryRunSession(failed);
        setSession(failed);
        if (data.code !== "no_issue") {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: data.error ?? t("something_went_wrong"),
          });
        }
      } finally {
        setIsRunning(false);
        clearRunParam();
      }
    },
    [workspaceSlug, board, t, clearRunParam]
  );

  useEffect(() => {
    const stored = loadAutomationDryRunSession(ruleId || undefined);
    setSession(stored);
    if (stored?.liveSteps?.length) {
      setLiveSteps(stored.liveSteps);
    }
    if (stored?.result) {
      setLiveResult(stored.result);
    }
  }, [ruleId]);

  useEffect(() => {
    if (!shouldRun || !ruleId || runStartedRef.current) return;
    const stored = loadAutomationDryRunSession(ruleId);
    if (!stored || (stored.status !== "pending" && stored.status !== "running")) return;

    runStartedRef.current = true;
    void startStream(stored);
  }, [shouldRun, ruleId, startStream]);

  const handleRerun = async () => {
    if (!session || isRunning) return;
    await startStream({
      ...session,
      status: "pending",
      result: undefined,
      liveSteps: [],
      simulatedAt: new Date().toISOString(),
    });
  };

  if (!ruleId) {
    return (
      <div className="rounded-lg border border-subtle bg-layer-1 p-6 text-center">
        <p className="text-13 text-secondary">{t("boards.settings.automation.dry_run_page.missing_rule")}</p>
        <button
          type="button"
          className="mt-3 text-13 text-accent-primary hover:underline"
          onClick={() => navigate(`/${workspaceSlug}/settings/boards/${board.slug}/automacao`)}
        >
          {t("boards.settings.automation.back_to_list")}
        </button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="rounded-lg border border-subtle bg-layer-1 p-6 text-center">
        <p className="text-13 text-secondary">{t("boards.settings.automation.dry_run_page.session_expired")}</p>
        <button type="button" className="mt-3 text-13 text-accent-primary hover:underline" onClick={handleBack}>
          {t("boards.settings.automation.dry_run_page.back_to_editor")}
        </button>
      </div>
    );
  }

  const completedResult = liveResult ?? session.result;
  const failedRun = !isRunning && session.status === "failed" && Boolean(session.error);
  const displayResult: TAutomationDryRunResult = isRunning
    ? {
        matched: true,
        passed_filters: true,
        steps: liveSteps,
        live: true,
        ...(completedResult?.test_issue_name
          ? {
              test_issue_id: completedResult.test_issue_id,
              test_issue_name: completedResult.test_issue_name,
            }
          : {}),
      }
    : failedRun
      ? {
          matched: false,
          steps: [],
          live: true,
          error: session.error,
          message: session.error,
        }
      : (completedResult ?? {
          matched: false,
          steps: [],
        });

  return (
    <BoardAutomationDryRunView
      ruleName={session.ruleName}
      graph={session.graph}
      result={displayResult}
      simulatedAt={session.simulatedAt}
      isRunning={isRunning}
      onBack={handleBack}
      onRerun={handleRerun}
      rerunning={isRunning}
      backLabel={from === "historico" ? t("boards.settings.automation.dry_run_page.back_to_history") : undefined}
    />
  );
});
