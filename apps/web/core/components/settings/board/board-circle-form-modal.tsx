import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { IBoardCircle, TBoardCircleFormData } from "@operoz/types";
import { CustomSelect, EModalPosition, EModalWidth, Input, ModalCore, TextArea } from "@operoz/ui";
import { useBoardAccess } from "@/hooks/store/use-board-access";

type Props = {
  workspaceSlug: string;
  boardSlug: string;
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  circle?: IBoardCircle | null;
  onSaved?: () => void;
};

type FormValues = TBoardCircleFormData;

export function BoardCircleFormModal(props: Props) {
  const { workspaceSlug, boardSlug, isOpen, onClose, mode, circle, onSaved } = props;
  const { t } = useTranslation();
  const { createBoardCircle, updateBoardCircle, getBoardRoles } = useBoardAccess();
  const roles = getBoardRoles(workspaceSlug, boardSlug);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: circle?.name ?? "",
      description: circle?.description ?? "",
      role_id: circle?.role_id ?? null,
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      name: mode === "edit" ? circle?.name ?? "" : "",
      description: circle?.description ?? "",
      role_id: circle?.role_id ?? null,
    });
  }, [isOpen, mode, circle, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (mode === "create") {
        await createBoardCircle(workspaceSlug, boardSlug, data);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("boards.settings.circles.create_success_title"),
          message: t("boards.settings.circles.create_success_message", { name: data.name }),
        });
      } else if (circle) {
        await updateBoardCircle(workspaceSlug, boardSlug, circle.id, data);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("boards.settings.circles.edit_success_title"),
          message: t("boards.settings.circles.edit_success_message", { name: data.name }),
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
      ? t("boards.settings.circles.create_circle")
      : t("boards.settings.circles.edit_circle", { name: circle?.name ?? "" });

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.LG}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
        <div className="border-b border-subtle px-4 py-3">
          <h3 className="text-16 font-semibold text-primary">{title}</h3>
        </div>
        <div className="space-y-4 px-4 py-4">
          <Controller
            control={control}
            name="name"
            rules={{ required: t("name_is_required") }}
            render={({ field }) => (
              <div className="space-y-1">
                <p className="text-11 font-medium text-secondary">{t("boards.settings.circles.name_label")}</p>
                <Input
                  {...field}
                  placeholder={t("boards.settings.circles.name_placeholder")}
                  hasError={Boolean(errors.name)}
                />
              </div>
            )}
          />
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <div className="space-y-1">
                <p className="text-11 font-medium text-secondary">{t("boards.settings.circles.description_label")}</p>
                <TextArea {...field} placeholder={t("boards.settings.circles.description_placeholder")} />
              </div>
            )}
          />
          <Controller
            control={control}
            name="role_id"
            render={({ field: { value, onChange } }) => (
              <div className="space-y-1">
                <p className="text-11 font-medium text-secondary">{t("boards.settings.circles.role_label")}</p>
                <CustomSelect
                  input
                  value={value ?? ""}
                  onChange={(val: string) => onChange(val || null)}
                  className="w-full"
                  buttonClassName="w-full justify-between"
                  label={
                    value
                      ? (roles.find((r) => r.id === value)?.name ?? t("boards.settings.circles.select_role_placeholder"))
                      : t("boards.settings.circles.select_role_placeholder")
                  }
                >
                  <CustomSelect.Option value="">{t("boards.settings.circles.no_role_option")}</CustomSelect.Option>
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
            {t("discard")}
          </Button>
          <Button variant="primary" type="submit" loading={isSubmitting}>
            {mode === "create" ? t("boards.settings.circles.create_circle") : t("save_changes")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
}
