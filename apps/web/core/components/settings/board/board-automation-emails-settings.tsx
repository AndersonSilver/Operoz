import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Mail } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { IBoard, IBoardAutomationEmailTemplate } from "@operoz/types";
import { BoardService } from "@/services/board/board.service";
import { BoardAutomationAssetsList } from "./automation/board-automation-assets-list";
import { useAutomationMemberLabels } from "./automation/use-automation-member-labels";
import { BoardAutomationEmailEditor } from "./automation/board-automation-email-editor";

const boardService = new BoardService();

const DEFAULT_HTML = `<h1>Olá</h1>
<p>O card <strong>{{issue.name}}</strong> foi atualizado.</p>
<p>Projeto: {{project.name}}</p>`;

export const BoardAutomationEmailsSettings = observer(function BoardAutomationEmailsSettings(props: {
  workspaceSlug: string;
  board: IBoard;
}) {
  const { workspaceSlug, board } = props;
  const { t } = useTranslation();
  const { resolveUser } = useAutomationMemberLabels(workspaceSlug, board.slug);
  const [templates, setTemplates] = useState<IBoardAutomationEmailTemplate[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const editingTemplate = templates.find((item) => item.id === editingId) ?? null;

  const load = async () => {
    setLoading(true);
    try {
      const data = await boardService.getAutomationEmailTemplates(workspaceSlug, board.slug);
      setTemplates(data);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [workspaceSlug, board.slug]);

  const createTemplate = async () => {
    setCreating(true);
    try {
      const created = await boardService.createAutomationEmailTemplate(workspaceSlug, board.slug, {
        name: t("boards.settings.automation.emails.new_name"),
        description: "",
        subject: t("boards.settings.automation.emails.default_subject"),
        html_body: DEFAULT_HTML,
        is_active: true,
      });
      setTemplates((prev) => [created, ...prev]);
      setEditingId(created.id);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (templateId: string) => {
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;
    try {
      const updated = await boardService.updateAutomationEmailTemplate(workspaceSlug, board.slug, template.id, {
        is_active: !template.is_active,
      });
      setTemplates((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      await boardService.deleteAutomationEmailTemplate(workspaceSlug, board.slug, templateId);
      setTemplates((prev) => prev.filter((item) => item.id !== templateId));
      if (editingId === templateId) setEditingId(null);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  if (editingTemplate) {
    return (
      <BoardAutomationEmailEditor
        workspaceSlug={workspaceSlug}
        board={board}
        template={editingTemplate}
        onBack={() => setEditingId(null)}
        onSaved={(updated) => setTemplates((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))}
        onDeleted={() => {
          setTemplates((prev) => prev.filter((item) => item.id !== editingTemplate.id));
          setEditingId(null);
        }}
      />
    );
  }

  return (
    <BoardAutomationAssetsList
      icon={Mail}
      theme="mail"
      heroTitle={t("boards.settings.automation.hero.emails_title")}
      lead={t("boards.settings.automation.emails.lead")}
      listTitle={t("boards.settings.automation.emails.list_title")}
      createLabel={t("boards.settings.automation.emails.create")}
      createHint={t("boards.settings.automation.hero.create_email_hint")}
      searchPlaceholder={t("boards.settings.automation.assets.search_placeholder")}
      emptyTitle={t("boards.settings.automation.emails.empty_list_title")}
      emptyDescription={t("boards.settings.automation.emails.empty_list_description")}
      items={templates.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        subtitle: item.subject,
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at,
        created_by: item.created_by,
        updated_by: item.updated_by,
      }))}
      loading={loading}
      creating={creating}
      onCreate={createTemplate}
      onEdit={setEditingId}
      onDelete={deleteTemplate}
      onToggleActive={toggleActive}
      resolveUser={resolveUser}
    />
  );
});
