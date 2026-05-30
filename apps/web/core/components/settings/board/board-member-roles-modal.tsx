import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { IBoardMember } from "@operis/types";
import { Checkbox, EModalPosition, EModalWidth, ModalCore } from "@operis/ui";
import { useBoardAccess } from "@/hooks/store/use-board-access";

type Props = {
  workspaceSlug: string;
  boardSlug: string;
  member: IBoardMember | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

export const BoardMemberRolesModal = observer(function BoardMemberRolesModal(props: Props) {
  const { workspaceSlug, boardSlug, member, isOpen, onClose, onSaved } = props;
  const { t } = useTranslation();
  const { getBoardRoles, updateBoardMemberRoles } = useBoardAccess();
  const roles = getBoardRoles(workspaceSlug, boardSlug);
  const [selected, setSelected] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (member) setSelected(member.role_ids);
  }, [member]);

  const toggle = (roleId: string) => {
    setSelected((prev) => (prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]));
  };

  const onSubmit = async () => {
    if (!member || selected.length === 0) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("boards.settings.access.roles_required"),
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await updateBoardMemberRoles(workspaceSlug, boardSlug, member.user_id, selected);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("boards.settings.access.roles_updated_title"),
        message: t("boards.settings.access.roles_updated_message"),
      });
      onSaved?.();
      onClose();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!member) return null;

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.MD}>
      <div className="flex flex-col">
        <div className="border-b border-subtle px-4 py-3">
          <h3 className="text-16 font-semibold text-primary">{t("boards.settings.access.edit_roles_title")}</h3>
          <p className="mt-1 text-13 text-tertiary">{member.member?.display_name ?? member.email}</p>
        </div>
        <div className="max-h-64 space-y-2 overflow-y-auto px-4 py-4">
          {roles.map((role) => (
            <label key={role.id} className="flex cursor-pointer items-center gap-2 py-1">
              <Checkbox checked={selected.includes(role.id)} onChange={() => toggle(role.id)} />
              <span className="text-13 text-primary">{role.name}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2 border-t border-subtle px-4 py-3">
          <Button variant="secondary" type="button" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button variant="primary" onClick={() => void onSubmit()} loading={isSubmitting}>
            {t("save_changes")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
