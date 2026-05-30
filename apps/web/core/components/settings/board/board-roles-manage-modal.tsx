/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Copy, Trash2 } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IBoardRole } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { useBoardAccess } from "@/hooks/store/use-board-access";
import { BoardRoleFormModal } from "./board-role-form-modal";
import { rolePermissionsToMap } from "./board-permission-utils";

type Props = {
  workspaceSlug: string;
  boardSlug: string;
  boardName: string;
  isOpen: boolean;
  onClose: () => void;
  onRolesChanged?: () => void;
};

export const BoardRolesManageModal = observer(function BoardRolesManageModal(props: Props) {
  const { workspaceSlug, boardSlug, boardName, isOpen, onClose, onRolesChanged } = props;
  const { t } = useTranslation();
  const { getBoardRoles, duplicateBoardRole, deleteBoardRole } = useBoardAccess();
  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<IBoardRole | null>(null);
  const [duplicateFrom, setDuplicateFrom] = useState<IBoardRole | null>(null);

  const roles = getBoardRoles(workspaceSlug, boardSlug);

  const handleDuplicate = async (role: IBoardRole) => {
    try {
      await duplicateBoardRole(workspaceSlug, boardSlug, role.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("boards.settings.roles.duplicate_success_title"),
        message: t("boards.settings.roles.duplicate_success_message", { name: role.name }),
      });
      onRolesChanged?.();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  const handleDelete = async (role: IBoardRole) => {
    try {
      await deleteBoardRole(workspaceSlug, boardSlug, role.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("boards.settings.roles.delete_success_title"),
        message: t("boards.settings.roles.delete_success_message", { name: role.name }),
      });
      onRolesChanged?.();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  return (
    <>
      <BoardRoleFormModal
        workspaceSlug={workspaceSlug}
        boardSlug={boardSlug}
        boardName={boardName}
        isOpen={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSaved={onRolesChanged}
      />
      {duplicateFrom && (
        <BoardRoleFormModal
          workspaceSlug={workspaceSlug}
          boardSlug={boardSlug}
          boardName={boardName}
          isOpen={Boolean(duplicateFrom)}
          mode="create"
          role={duplicateFrom}
          initialPermissions={rolePermissionsToMap(duplicateFrom)}
          onClose={() => setDuplicateFrom(null)}
          onSaved={onRolesChanged}
        />
      )}
      {editRole && (
        <BoardRoleFormModal
          workspaceSlug={workspaceSlug}
          boardSlug={boardSlug}
          boardName={boardName}
          isOpen={Boolean(editRole)}
          mode="edit"
          role={editRole}
          onClose={() => setEditRole(null)}
          onSaved={onRolesChanged}
        />
      )}
      <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.XL}>
        <div className="flex max-h-[80vh] flex-col">
          <div className="border-b border-subtle px-4 py-3">
            <h3 className="text-16 font-semibold text-primary">{t("boards.settings.roles.manage_title")}</h3>
            <p className="mt-1 text-13 text-tertiary">{t("boards.settings.roles.manage_description")}</p>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <ul className="divide-y divide-subtle">
              {roles.map((role) => (
                <li key={role.id} className="flex items-start justify-between gap-3 py-3">
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setEditRole(role)}>
                    <p className="text-14 font-medium text-primary">{role.name}</p>
                    <p className="mt-0.5 line-clamp-2 text-13 text-tertiary">{role.description}</p>
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="secondary" size="sm" onClick={() => void handleDuplicate(role)}>
                      <Copy className="size-3.5" />
                      {t("boards.settings.roles.duplicate")}
                    </Button>
                    {!role.is_system && (
                      <Button variant="danger" size="sm" onClick={() => void handleDelete(role)}>
                        <Trash2 className="size-3.5" />
                        {t("remove")}
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-between gap-2 border-t border-subtle px-4 py-3">
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              {t("boards.settings.roles.create_role")}
            </Button>
            <Button variant="secondary" onClick={onClose}>
              {t("close")}
            </Button>
          </div>
        </div>
      </ModalCore>
    </>
  );
});
