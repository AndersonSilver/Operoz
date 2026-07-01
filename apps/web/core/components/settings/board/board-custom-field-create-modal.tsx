import type { IWorkspaceCustomField } from "@operoz/types";
import { useTranslation } from "@operoz/i18n";
import { BoardCustomFieldCreateForm } from "./board-custom-field-create-form";
import { SettingsSidePanel } from "./settings-side-panel";

type Props = {
  workspaceSlug: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (field: IWorkspaceCustomField) => void;
};

/** Painel lateral para criar campo no workspace (uso isolado, se necessário). */
export function BoardCustomFieldCreateModal(props: Props) {
  const { workspaceSlug, isOpen, onClose, onCreated } = props;
  const { t } = useTranslation();

  return (
    <SettingsSidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={t("boards.settings.fields.create_workspace_title")}
      description={t("boards.settings.fields.create_workspace_hint")}
    >
      <BoardCustomFieldCreateForm
        workspaceSlug={workspaceSlug}
        onCancel={onClose}
        onCreated={(field) => {
          onCreated?.(field);
          onClose();
        }}
      />
    </SettingsSidePanel>
  );
}
