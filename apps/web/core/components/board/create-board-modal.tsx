import { useTranslation } from "@operis/i18n";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { TBoardFormData } from "@operis/types";
import { EModalPosition, EModalWidth, ModalCore } from "@operis/ui";
import useKeypress from "@/hooks/use-keypress";
import { CreateBoardForm } from "./create-board-form";

type Props = {
  workspaceSlug: string;
  isOpen: boolean;
  onClose: () => void;
};

export function CreateBoardModal(props: Props) {
  const { workspaceSlug, isOpen, onClose } = props;
  const { t } = useTranslation();

  useKeypress("Escape", () => {
    if (isOpen) onClose();
  });

  const handleCreated = (data: TBoardFormData & { slug: string }) => {
    setToast({
      type: TOAST_TYPE.SUCCESS,
      title: t("boards.create_success_title"),
      message: t("boards.create_success_message", { name: data.name }),
    });
  };

  return (
    <ModalCore
      isOpen={isOpen}
      handleClose={onClose}
      position={EModalPosition.TOP}
      width={EModalWidth.LG}
      className="overflow-hidden rounded-lg"
    >
      <CreateBoardForm
        workspaceSlug={workspaceSlug}
        onClose={onClose}
        onCreated={handleCreated}
      />
    </ModalCore>
  );
}
