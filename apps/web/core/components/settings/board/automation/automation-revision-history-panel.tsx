import { useCallback, useEffect, useState } from "react";
import { Clock3, GitBranchPlus, RotateCcw, X } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { Loader } from "@operoz/ui";
import type { IBoardAutomationRuleRevision } from "@operoz/types";
import { BoardService } from "@/services/board/board.service";
import { summarizeAutomationGraph } from "./automation-utils";
import "./automation-inspector.css";

const boardService = new BoardService();

type Props = {
  workspaceSlug: string;
  boardSlug: string;
  ruleId: string;
  onClose: () => void;
  onRestored: () => void;
};

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AutomationRevisionHistoryPanel(props: Props) {
  const { workspaceSlug, boardSlug, ruleId, onClose, onRestored } = props;
  const { t } = useTranslation();
  const [revisions, setRevisions] = useState<IBoardAutomationRuleRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await boardService.getAutomationRuleRevisions(workspaceSlug, boardSlug, ruleId);
      setRevisions(data);
    } finally {
      setLoading(false);
    }
  }, [workspaceSlug, boardSlug, ruleId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRestore = async (revisionId: string) => {
    setRestoringId(revisionId);
    try {
      await boardService.restoreAutomationRuleRevision(workspaceSlug, boardSlug, ruleId, revisionId);
      onRestored();
      onClose();
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="automation-inspector-panel">
      <header className="automation-inspector-header">
        <span className="automation-inspector-header-accent bg-accent-primary" aria-hidden />
        <div className="flex items-start justify-between gap-3 pl-2">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-subtle">
              <Clock3 className="size-4 text-accent-primary" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <h2 className="text-14 leading-tight font-semibold text-primary">
                {t("boards.settings.automation.editor.revision_history")}
              </h2>
              <p className="mt-0.5 text-11 leading-relaxed text-tertiary">
                {t("boards.settings.automation.editor.revision_history_lead")}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-tertiary transition-colors hover:bg-layer-1-hover hover:text-primary"
            onClick={onClose}
            aria-label={t("close")}
          >
            <X className="size-4" strokeWidth={1.75} />
          </button>
        </div>
      </header>

      <div className="automation-inspector-body">
        {loading ? (
          <div className="flex items-center gap-2 text-13 text-tertiary">
            <Loader />
            {t("loading")}
          </div>
        ) : revisions.length === 0 ? (
          <div className="automation-inspector-callout">
            <p className="text-11 leading-relaxed text-secondary">
              {t("boards.settings.automation.editor.revision_empty")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {revisions.map((revision) => {
              const summary = summarizeAutomationGraph(revision.graph);
              const isPublished = revision.kind === "published";
              return (
                <article key={revision.id} className="automation-inspector-branch-card">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={
                          isPublished
                            ? "inline-flex rounded-full bg-success-subtle px-2 py-0.5 text-10 font-semibold tracking-wide text-success-primary uppercase"
                            : "inline-flex rounded-full bg-layer-2 px-2 py-0.5 text-10 font-semibold tracking-wide text-secondary uppercase"
                        }
                      >
                        {isPublished
                          ? t("boards.settings.automation.editor.revision_kind_published")
                          : t("boards.settings.automation.editor.revision_kind_draft")}
                      </span>
                      <p className="mt-1 text-13 font-medium text-primary">{revision.name}</p>
                      <p className="text-11 text-tertiary">{formatWhen(revision.created_at)}</p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={restoringId === revision.id}
                      onClick={() => handleRestore(revision.id)}
                      prependIcon={<RotateCcw className="size-3.5" strokeWidth={1.75} />}
                    >
                      {t("boards.settings.automation.editor.revision_restore")}
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-11 text-tertiary">
                    <GitBranchPlus className="size-3.5 shrink-0" strokeWidth={1.75} />
                    <span>{summary.triggerLabel || "—"}</span>
                    <span aria-hidden>·</span>
                    <span>
                      {t("boards.settings.automation.rules_list.steps_badge", {
                        count: summary.stepCount,
                      })}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
