import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { observer } from "mobx-react";
import { UserPlus } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import { CustomSelect, EModalPosition, EModalWidth, ModalCore } from "@operis/ui";
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

const FIELD_LABEL = "text-11 font-medium text-secondary";
const FIELD_WRAP = "space-y-1.5";

export const BoardAccessAddMemberModal = observer(function BoardAccessAddMemberModal(props: Props) {
  const { workspaceSlug, boardSlug, isOpen, onClose, onAdded } = props;
  const { t } = useTranslation();
  const { assignBoardMember, getBoardRoles } = useBoardAccess();
  const roles = getBoardRoles(workspaceSlug, boardSlug);
  const defaultRoleId = useMemo(() => roles.find((r) => r.slug === "member")?.id ?? roles[0]?.id ?? "", [roles]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { user_id: "", role_id: defaultRoleId },
  });

  const selectedUserId = watch("user_id");
  const selectedRoleId = watch("role_id");

  useEffect(() => {
    if (!isOpen) return;
    reset({ user_id: "", role_id: defaultRoleId });
  }, [isOpen, defaultRoleId, reset]);

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
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
        <div className="border-b border-subtle px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-subtle bg-accent-subtle text-accent-primary">
              <UserPlus className="size-4" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <h3 className="text-16 font-semibold text-primary">{t("boards.settings.access.add_people")}</h3>
              <p className="mt-1 text-12 leading-relaxed text-tertiary">
                {t("boards.settings.access.add_modal_description")}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5">
          <Controller
            control={control}
            name="user_id"
            rules={{ required: t("field_is_required") }}
            render={({ field: { value, onChange } }) => (
              <div className={FIELD_WRAP}>
                <p className={FIELD_LABEL}>{t("boards.settings.access.member_label")}</p>
                <WorkspaceMemberSelect
                  workspaceSlug={workspaceSlug}
                  value={value}
                  onChange={onChange}
                  allowEmpty={false}
                  placeholder={t("boards.settings.access.select_member_placeholder")}
                />
              </div>
            )}
          />
          <Controller
            control={control}
            name="role_id"
            rules={{ required: t("field_is_required") }}
            render={({ field: { value, onChange } }) => (
              <div className={FIELD_WRAP}>
                <p className={FIELD_LABEL}>{t("boards.settings.access.role_label")}</p>
                <CustomSelect
                  input
                  value={value}
                  onChange={onChange}
                  className="w-full"
                  buttonClassName="w-full justify-between"
                  label={
                    value
                      ? (roles.find((r) => r.id === value)?.name ?? t("boards.settings.access.role_label"))
                      : t("boards.settings.access.select_role_placeholder")
                  }
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

        <div className="flex justify-end gap-2 border-t border-subtle px-5 py-4">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            loading={isSubmitting}
            disabled={!selectedUserId || !selectedRoleId}
          >
            {t("boards.settings.access.add_people")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
