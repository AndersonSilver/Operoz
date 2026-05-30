import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { IBoardRole, TBoardRoleFormData, TBoardRolePermissionsMap } from "@operis/types";
import { EModalPosition, EModalWidth, Input, ModalCore, TextArea } from "@operis/ui";
import { useBoardAccess } from "@/hooks/store/use-board-access";
import { BoardRolePermissionsTree } from "./board-role-permissions-tree";
import { emptyPermissionsMap, rolePermissionsToMap } from "./board-permission-utils";

type Props = {
  workspaceSlug: string;
  boardSlug: string;
  boardName: string;
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  role?: IBoardRole | null;
  initialPermissions?: TBoardRolePermissionsMap;
  onSaved?: () => void;
};

type FormValues = TBoardRoleFormData & { permissions: TBoardRolePermissionsMap };

export function BoardRoleFormModal(props: Props) {
  const { workspaceSlug, boardSlug, boardName, isOpen, onClose, mode, role, initialPermissions, onSaved } = props;
  const { t } = useTranslation();
  const { createBoardRole, updateBoardRole, getPermissionCatalog, fetchPermissionCatalog } = useBoardAccess();

  const catalog = getPermissionCatalog(workspaceSlug, boardSlug);

  useEffect(() => {
    if (isOpen && !catalog) {
      void fetchPermissionCatalog(workspaceSlug, boardSlug);
    }
  }, [isOpen, catalog, fetchPermissionCatalog, workspaceSlug, boardSlug]);

  const defaultPerms = useMemo(() => {
    if (initialPermissions) return initialPermissions;
    if (role) return rolePermissionsToMap(role);
    if (catalog) return emptyPermissionsMap(catalog.keys_v1);
    return {};
  }, [initialPermissions, role, catalog]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: role?.name ?? "",
      description: role?.description ?? "",
      permissions: defaultPerms,
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      name: mode === "edit" && role ? role.name : role ? `${role.name} (${t("boards.settings.roles.duplicate_suffix")})` : "",
      description: role?.description ?? "",
      permissions: defaultPerms,
    });
  }, [isOpen, mode, role, defaultPerms, reset]);

  const permissions = watch("permissions");

  const onSubmit = async (data: FormValues) => {
    try {
      if (mode === "create") {
        await createBoardRole(workspaceSlug, boardSlug, {
          name: data.name,
          description: data.description,
          permissions: data.permissions,
        });
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("boards.settings.roles.create_success_title"),
          message: t("boards.settings.roles.create_success_message", { name: data.name }),
        });
      } else if (role) {
        const payload: Partial<TBoardRoleFormData> & { permissions?: TBoardRolePermissionsMap } = {
          description: data.description,
          permissions: data.permissions,
        };
        if (!role.is_system) payload.name = data.name;
        await updateBoardRole(workspaceSlug, boardSlug, role.id, payload);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("boards.settings.roles.edit_success_title"),
          message: t("boards.settings.roles.edit_success_message", { name: data.name }),
        });
      }
      onSaved?.();
      onClose();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  const title =
    mode === "create"
      ? t("boards.settings.roles.create_role")
      : t("boards.settings.roles.edit_role", { name: role?.name ?? "" });

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex max-h-[85vh] flex-col">
        <div className="border-b border-subtle px-4 py-3">
          <h3 className="text-16 font-semibold text-primary">{title}</h3>
        </div>
        <div className="space-y-4 overflow-y-auto px-4 py-4">
          <Controller
            control={control}
            name="name"
            rules={{ required: t("name_is_required") }}
            render={({ field }) => (
              <div className="space-y-1">
                <p className="text-11 font-medium text-secondary">{t("boards.settings.roles.name_label")}</p>
                <Input
                  {...field}
                  disabled={mode === "edit" && Boolean(role?.is_system)}
                  placeholder={t("boards.settings.roles.name_placeholder")}
                  hasError={Boolean(errors.name)}
                />
              </div>
            )}
          />
          <Controller
            control={control}
            name="description"
            rules={{ required: t("field_is_required") }}
            render={({ field }) => (
              <div className="space-y-1">
                <p className="text-11 font-medium text-secondary">{t("boards.settings.roles.description_label")}</p>
                <TextArea
                  {...field}
                  placeholder={t("boards.settings.roles.description_placeholder")}
                  hasError={Boolean(errors.description)}
                />
              </div>
            )}
          />
          {catalog && (
            <BoardRolePermissionsTree
              boardName={boardName}
              tree={catalog.tree}
              value={permissions}
              onChange={(next) => setValue("permissions", next, { shouldDirty: true })}
              disabled={mode === "edit" && Boolean(role?.is_system)}
            />
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-subtle px-4 py-3">
          <Button variant="secondary" type="button" onClick={onClose}>
            {t("discard")}
          </Button>
          <Button variant="primary" type="submit" loading={isSubmitting}>
            {mode === "create" ? t("boards.settings.roles.create_role") : t("save_changes")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
}
