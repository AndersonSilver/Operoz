import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useSearchParams } from "react-router";
import { useTranslation } from "@operis/i18n";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { IBoard, IBoardAutomationRule, TAutomationCatalog } from "@operis/types";
import { Loader } from "@operis/ui";
import { BoardService } from "@/services/board/board.service";
import { BoardAutomationEditor } from "./automation/board-automation-editor";
import { BoardAutomationRulesList } from "./automation/board-automation-rules-list";
import { createDefaultGraph } from "./automation/automation-utils";

const boardService = new BoardService();

export const BoardAutomationSettings = observer(function BoardAutomationSettings(props: {
  workspaceSlug: string;
  board: IBoard;
}) {
  const { workspaceSlug, board } = props;
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const ruleFromUrl = searchParams.get("rule");
  const [rules, setRules] = useState<IBoardAutomationRule[]>([]);
  const [catalog, setCatalog] = useState<TAutomationCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [editingRule, setEditingRule] = useState<IBoardAutomationRule | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const [rulesData, catalogData] = await Promise.all([
        boardService.getAutomationRules(workspaceSlug, board.slug),
        boardService.getAutomationCatalog(workspaceSlug, board.slug),
      ]);
      setRules(rulesData);
      setCatalog(catalogData);
    } catch {
      setLoadFailed(true);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("something_went_wrong"),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [workspaceSlug, board.slug]);

  useEffect(() => {
    if (!ruleFromUrl || loading || !rules.length) return;
    const match = rules.find((r) => r.id === ruleFromUrl);
    if (match) {
      setEditingRule(match);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("rule");
          return next;
        },
        { replace: true }
      );
    }
  }, [ruleFromUrl, loading, rules]);

  const handleCreate = async () => {
    if (!catalog?.triggers?.length) return;
    setCreating(true);
    try {
      const graph = createDefaultGraph(catalog.triggers[0]);
      const rule = await boardService.createAutomationRule(workspaceSlug, board.slug, {
        name: t("boards.settings.automation.new_rule_name"),
        description: "",
        enabled: false,
        graph,
      });
      setRules((prev) => [rule, ...prev]);
      setEditingRule(rule);
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("something_went_wrong"),
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (ruleId: string) => {
    try {
      await boardService.deleteAutomationRule(workspaceSlug, board.slug, ruleId);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
      if (editingRule?.id === ruleId) setEditingRule(null);
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("something_went_wrong"),
      });
    }
  };

  const toggleEnabled = async (rule: IBoardAutomationRule) => {
    if (!rule.is_published && !rule.enabled) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("boards.settings.automation.editor.enable_requires_publish"),
      });
      return;
    }
    try {
      const updated = await boardService.updateAutomationRule(workspaceSlug, board.slug, rule.id, {
        enabled: !rule.enabled,
      });
      setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
    } catch (error: unknown) {
      const payload = error as { code?: string; error?: string };
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message:
          payload?.code === "publish_required_before_enable"
            ? t("boards.settings.automation.editor.enable_requires_publish")
            : payload?.error ?? t("something_went_wrong"),
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center gap-2 text-13 text-tertiary">
        <Loader />
        {t("loading")}
      </div>
    );
  }

  if (loadFailed || !catalog) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-center text-13 text-tertiary">
        <p>{t("something_went_wrong")}</p>
        <button
          type="button"
          className="text-accent-primary hover:underline"
          onClick={() => void load()}
        >
          {t("refresh")}
        </button>
      </div>
    );
  }

  if (editingRule) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <BoardAutomationEditor
          workspaceSlug={workspaceSlug}
          board={board}
          rule={editingRule}
          catalog={catalog}
          onBack={() => setEditingRule(null)}
          onSaved={(updated) => {
            setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
            setEditingRule(updated);
          }}
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
    <BoardAutomationRulesList
      workspaceSlug={workspaceSlug}
      boardSlug={board.slug}
      rules={rules}
      creating={creating}
      onCreate={handleCreate}
      onEdit={setEditingRule}
      onDelete={handleDelete}
      onToggleEnabled={toggleEnabled}
    />
    </div>
  );
});
