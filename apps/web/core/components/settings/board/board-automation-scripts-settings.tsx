import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Code2 } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { IBoard, IBoardAutomationScript } from "@operis/types";
import { BoardService } from "@/services/board/board.service";
import { BoardAutomationAssetsList } from "./automation/board-automation-assets-list";
import { useAutomationMemberLabels } from "./automation/use-automation-member-labels";
import { BoardAutomationScriptEditor } from "./automation/board-automation-script-editor";

const boardService = new BoardService();

const DEFAULT_SCRIPT = `// context.event, context.issue_id, context.rule_id
return { ok: true };`;

export const BoardAutomationScriptsSettings = observer(function BoardAutomationScriptsSettings(props: {
  workspaceSlug: string;
  board: IBoard;
}) {
  const { workspaceSlug, board } = props;
  const { t } = useTranslation();
  const { resolveUser } = useAutomationMemberLabels(workspaceSlug, board.slug);
  const [scripts, setScripts] = useState<IBoardAutomationScript[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const editingScript = scripts.find((s) => s.id === editingId) ?? null;

  const load = async () => {
    setLoading(true);
    try {
      const data = await boardService.getAutomationScripts(workspaceSlug, board.slug);
      setScripts(data);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [workspaceSlug, board.slug]);

  const createScript = async () => {
    setCreating(true);
    try {
      const created = await boardService.createAutomationScript(workspaceSlug, board.slug, {
        name: t("boards.settings.automation.scripts.new_name"),
        description: "",
        source_code: DEFAULT_SCRIPT,
        is_active: true,
      });
      setScripts((prev) => [created, ...prev]);
      setEditingId(created.id);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (scriptId: string) => {
    const script = scripts.find((s) => s.id === scriptId);
    if (!script) return;
    try {
      const updated = await boardService.updateAutomationScript(workspaceSlug, board.slug, script.id, {
        is_active: !script.is_active,
      });
      setScripts((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  const deleteScript = async (scriptId: string) => {
    try {
      await boardService.deleteAutomationScript(workspaceSlug, board.slug, scriptId);
      setScripts((prev) => prev.filter((s) => s.id !== scriptId));
      if (editingId === scriptId) setEditingId(null);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  if (editingScript) {
    return (
      <BoardAutomationScriptEditor
        workspaceSlug={workspaceSlug}
        board={board}
        script={editingScript}
        onBack={() => setEditingId(null)}
        onSaved={(updated) => setScripts((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))}
        onDeleted={() => {
          setScripts((prev) => prev.filter((s) => s.id !== editingScript.id));
          setEditingId(null);
        }}
      />
    );
  }

  return (
    <BoardAutomationAssetsList
      icon={Code2}
      theme="code"
      heroTitle={t("boards.settings.automation.hero.scripts_title")}
      lead={t("boards.settings.automation.scripts.lead")}
      listTitle={t("boards.settings.automation.scripts.list_title")}
      createLabel={t("boards.settings.automation.scripts.create")}
      createHint={t("boards.settings.automation.hero.create_script_hint")}
      searchPlaceholder={t("boards.settings.automation.assets.search_placeholder")}
      emptyTitle={t("boards.settings.automation.scripts.empty_list_title")}
      emptyDescription={t("boards.settings.automation.scripts.empty_list_description")}
      items={scripts.map((script) => ({
        id: script.id,
        name: script.name,
        description: script.description,
        is_active: script.is_active,
        created_at: script.created_at,
        updated_at: script.updated_at,
        created_by: script.created_by,
        updated_by: script.updated_by,
        metaLabel: t("boards.settings.automation.assets_list.lines_badge", {
          count: script.source_code.split("\n").length,
        }),
      }))}
      loading={loading}
      creating={creating}
      onCreate={createScript}
      onEdit={setEditingId}
      onDelete={deleteScript}
      onToggleActive={toggleActive}
      resolveUser={resolveUser}
    />
  );
});
