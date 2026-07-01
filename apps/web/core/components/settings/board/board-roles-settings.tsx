import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { IBoardRole } from "@operoz/types";
import { Loader } from "@operoz/ui";
import { SettingsHeading } from "@/components/settings/heading";
import { useBoardAccess } from "@/hooks/store/use-board-access";
import { BoardRoleFormModal } from "./board-role-form-modal";
import { rolePermissionsToMap } from "./board-permission-utils";

type Props = {
  workspaceSlug: string;
  boardSlug: string;
  boardName: string;
};

export const BoardRolesSettings = observer(function BoardRolesSettings(props: Props) {
  const { workspaceSlug, boardSlug, boardName } = props;
  const { t } = useTranslation();
  const { fetchBoardRoles, fetchPermissionCatalog, getBoardRoles, duplicateBoardRole, deleteBoardRole } =
    useBoardAccess();
  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<IBoardRole | null>(null);
  const [duplicateFrom, setDuplicateFrom] = useState<IBoardRole | null>(null);

  const { isLoading } = useSWR(
    workspaceSlug && boardSlug ? `BOARD_ROLES_${workspaceSlug}_${boardSlug}` : null,
    async () => {
      await fetchPermissionCatalog(workspaceSlug, boardSlug);
      return fetchBoardRoles(workspaceSlug, boardSlug);
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    }
  );

  const roles = getBoardRoles(workspaceSlug, boardSlug);

  const reload = () => void fetchBoardRoles(workspaceSlug, boardSlug);

  const handleDuplicate = async (role: IBoardRole) => {
    try {
      await duplicateBoardRole(workspaceSlug, boardSlug, role.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("boards.settings.roles.duplicate_success_title"),
        message: t("boards.settings.roles.duplicate_success_message", { name: role.name }),
      });
      reload();
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
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  return (
    <div className="w-full">
      <BoardRoleFormModal
        workspaceSlug={workspaceSlug}
        boardSlug={boardSlug}
        boardName={boardName}
        isOpen={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSaved={reload}
      />
      {editRole && (
        <BoardRoleFormModal
          workspaceSlug={workspaceSlug}
          boardSlug={boardSlug}
          boardName={boardName}
          isOpen={Boolean(editRole)}
          mode="edit"
          role={editRole}
          onClose={() => setEditRole(null)}
          onSaved={reload}
        />
      )}
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
          onSaved={reload}
        />
      )}

      <SettingsHeading
        title={t("boards.settings.roles.heading")}
        description={t("boards.settings.roles.page_description", { board: boardName })}
        control={
          <Button variant="primary" size="lg" onClick={() => setCreateOpen(true)}>
            {t("boards.settings.roles.create_role")}
          </Button>
        }
      />

      {isLoading && roles.length === 0 ? (
        <Loader className="mt-6 w-full max-w-2xl space-y-2">
          <Loader.Item height="64px" />
          <Loader.Item height="64px" />
        </Loader>
      ) : (
        <ul className="mt-6 divide-y divide-subtle rounded-lg border border-subtle">
          {roles.map((role) => (
            <li key={role.id} className="flex items-start justify-between gap-4 bg-layer-2 px-4 py-4">
              <div className="min-w-0">
                <p className="text-14 font-semibold text-primary">
                  {role.name}
                  {role.is_system && (
                    <span className="font-normal ml-2 rounded bg-layer-1 px-1.5 py-0.5 text-11 text-tertiary">
                      {t("boards.settings.roles.system_badge")}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-13 text-tertiary">{role.description}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="secondary" size="sm" onClick={() => setEditRole(role)}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button variant="secondary" size="sm" onClick={() => void handleDuplicate(role)}>
                  <Copy className="size-3.5" />
                </Button>
                {!role.is_system && (
                  <Button variant="danger" size="sm" onClick={() => void handleDelete(role)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
