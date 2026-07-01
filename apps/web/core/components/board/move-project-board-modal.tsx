import { useEffect } from "react";
import { observer } from "mobx-react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import { EModalPosition, EModalWidth, ModalCore } from "@operoz/ui";
import useKeypress from "@/hooks/use-keypress";
import { useProject } from "@/hooks/store/use-project";
import { BoardSelectField } from "./board-select-field";

type FormValues = {
  board_id: string;
};

type Props = {
  workspaceSlug: string;
  projectId: string;
  projectName: string;
  currentBoardId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onMoved?: () => void;
};

export const MoveProjectBoardModal = observer(function MoveProjectBoardModal(props: Props) {
  const { workspaceSlug, projectId, projectName, currentBoardId, isOpen, onClose, onMoved } = props;
  const { t } = useTranslation();
  const { updateProject } = useProject();

  const methods = useForm<FormValues>({
    defaultValues: { board_id: currentBoardId ?? "" },
  });

  const { handleSubmit, reset } = methods;
  const isUnassigned = !currentBoardId;

  useEffect(() => {
    if (isOpen) reset({ board_id: currentBoardId ?? "" });
  }, [isOpen, currentBoardId, reset]);

  useKeypress("Escape", () => {
    if (isOpen) onClose();
  });

  const handleClose = () => {
    onClose();
    reset({ board_id: currentBoardId ?? "" });
  };

  const onSubmit = async (values: FormValues) => {
    if (!values.board_id) return;

    try {
      await updateProject(workspaceSlug, projectId, { board_id: values.board_id });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: isUnassigned
          ? t("boards.assign_board_success_message", { name: projectName })
          : t("boards.move_board_success_message", { name: projectName }),
      });
      onMoved?.();
      handleClose();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("something_went_wrong"),
      });
    }
  };

  return (
    <ModalCore
      isOpen={isOpen}
      handleClose={handleClose}
      position={EModalPosition.TOP}
      width={EModalWidth.LG}
      className="overflow-hidden rounded-lg"
    >
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-5">
          <div>
            <h3 className="text-15 font-semibold text-primary">
              {isUnassigned ? t("boards.assign_to_board") : t("boards.move_to_board")}
            </h3>
            <p className="mt-1 text-13 text-tertiary">{t("boards.move_board_modal_hint", { name: projectName })}</p>
          </div>
          <BoardSelectField tabIndex={1} required />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={handleClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="primary">
              {isUnassigned ? t("boards.assign_to_board") : t("boards.move_to_board")}
            </Button>
          </div>
        </form>
      </FormProvider>
    </ModalCore>
  );
});
