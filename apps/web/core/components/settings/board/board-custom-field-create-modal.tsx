/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { IWorkspaceCustomField } from "@plane/types";
import { useTranslation } from "@plane/i18n";
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
