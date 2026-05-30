/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { CustomSelect, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { useBoardAccess } from "@/hooks/store/use-board-access";
import { WorkspaceMemberSelect } from "@/components/workspace/workspace-member-select";

type Props = {
  workspaceSlug: string;
  boardSlug: string;
  isOpen: boolean;
  onClose: () => void;
  onAdded?: () => void;
};

type FormValues = {
  user_id: string;
  role_id: string;
};

export const BoardAccessAddMemberModal = observer(function BoardAccessAddMemberModal(props: Props) {
  const { workspaceSlug, boardSlug, isOpen, onClose, onAdded } = props;
  const { t } = useTranslation();
  const { assignBoardMember, getBoardRoles } = useBoardAccess();
  const roles = getBoardRoles(workspaceSlug, boardSlug);
  const defaultRoleId = useMemo(
    () => roles.find((r) => r.slug === "member")?.id ?? roles[0]?.id ?? "",
    [roles]
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { user_id: "", role_id: defaultRoleId },
  });

  const onSubmit = async (data: FormValues) => {
    if (!data.user_id || !data.role_id) return;
    try {
      await assignBoardMember(workspaceSlug, boardSlug, {
        user_id: data.user_id,
        role_ids: [data.role_id],
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("boards.settings.access.add_success_title"),
        message: t("boards.settings.access.add_success_message"),
      });
      reset({ user_id: "", role_id: defaultRoleId });
      onAdded?.();
      onClose();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.LG}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col"
        onReset={() => reset({ user_id: "", role_id: defaultRoleId })}
      >
        <div className="border-b border-subtle px-4 py-3">
          <h3 className="text-16 font-semibold text-primary">{t("boards.settings.access.add_people")}</h3>
        </div>
        <div className="space-y-4 px-4 py-4">
          <Controller
            control={control}
            name="user_id"
            rules={{ required: t("field_is_required") }}
            render={({ field: { value, onChange } }) => (
              <div className="space-y-1">
                <p className="text-11 font-medium text-secondary">{t("boards.settings.access.member_label")}</p>
                <WorkspaceMemberSelect workspaceSlug={workspaceSlug} value={value} onChange={onChange} />
              </div>
            )}
          />
          <Controller
            control={control}
            name="role_id"
            rules={{ required: t("field_is_required") }}
            render={({ field: { value, onChange } }) => (
              <div className="space-y-1">
                <p className="text-11 font-medium text-secondary">{t("boards.settings.access.role_label")}</p>
                <CustomSelect
                  value={value}
                  onChange={onChange}
                  label={
                    value ? roles.find((r) => r.id === value)?.name ?? t("boards.settings.access.role_label") : ""
                  }
                  buttonClassName="w-full"
                >
                  {roles.map((role) => (
                    <CustomSelect.Option key={role.id} value={role.id}>
                      {role.name}
                    </CustomSelect.Option>
                  ))}
                </CustomSelect>
              </div>
            )}
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-subtle px-4 py-3">
          <Button variant="secondary" type="button" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button variant="primary" type="submit" loading={isSubmitting}>
            {t("add")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
