import { useEffect, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { ImageIcon } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import { Button } from "@operis/propel/button";
import { EmojiPicker, EmojiIconPickerTypes, Logo } from "@operis/propel/emoji-icon-picker";
import { EUserPermissions, EUserPermissionsLevel } from "@operis/constants";
import type { IBoard, IUserLite, TBoardFormData, TLogoProps } from "@operis/types";
import { Input, TextArea, cn } from "@operis/ui";
import { WorkspaceMemberSelect } from "@/components/workspace/workspace-member-select";
import { useBoard } from "@/hooks/store/use-board";
import { useUserPermissions } from "@/hooks/store/user";
import {
  issueFormControlBaseClass,
  issueFormControlBorderClass,
} from "@/plane-web/components/issues/issue-modal/issue-form-field";

type Props = {
  workspaceSlug: string;
  board: IBoard;
};

function FieldLabel(props: { children: ReactNode; required?: boolean }) {
  const { children, required } = props;
  return (
    <p className="text-11 font-medium text-secondary">
      {children}
      {required ? <span className="text-danger-primary"> *</span> : null}
    </p>
  );
}

export function BoardInformationsForm(props: Props) {
  const { workspaceSlug, board } = props;
  const { t } = useTranslation();
  const { updateBoard } = useBoard();
  const { allowPermissions } = useUserPermissions();
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE, workspaceSlug);

  const toMemberId = (user: IUserLite | string | null | undefined) =>
    user && typeof user === "object" ? user.id : user ?? null;

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<TBoardFormData>({
    defaultValues: {
      name: board.name,
      description: board.description ?? "",
      logo_props: board.logo_props,
      board_lead: toMemberId(board.board_lead),
      default_assignee: toMemberId(board.default_assignee),
    },
    mode: "onChange",
  });

  const watchedName = watch("name");
  const canSave = isDirty;
  const boardLeadId = toMemberId(board.board_lead);
  const defaultAssigneeId = toMemberId(board.default_assignee);

  // Sincroniza ao trocar de board ou quando lead/assignee mudam no store (ex.: após guardar).
  useEffect(() => {
    reset({
      name: board.name,
      description: board.description ?? "",
      logo_props: board.logo_props,
      board_lead: boardLeadId,
      default_assignee: defaultAssigneeId,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.id, boardLeadId, defaultAssigneeId]);

  const onSubmit = async (data: TBoardFormData) => {
    if (!canSave) return;
    try {
      const boardLead =
        data.board_lead === "none" || !data.board_lead ? null : data.board_lead;
      const defaultAssignee =
        data.default_assignee === "none" || !data.default_assignee ? null : data.default_assignee;
      const payload: Partial<TBoardFormData> = {
        name: data.name,
        description: data.description,
        logo_props: data.logo_props,
        board_lead: boardLead,
        default_assignee: defaultAssignee,
      };
      const updated = await updateBoard(workspaceSlug, board.slug, payload);
      const savedBoardLead = toMemberId(updated.board_lead) ?? boardLead;
      const savedDefaultAssignee = toMemberId(updated.default_assignee) ?? defaultAssignee;
      reset({
        name: updated.name,
        description: updated.description ?? "",
        logo_props: updated.logo_props,
        board_lead: savedBoardLead,
        default_assignee: savedDefaultAssignee,
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("boards.edit_success_title"),
        message: t("boards.edit_success_message", { name: updated.name }),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("something_went_wrong"),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-2xl">
      <div className="overflow-hidden rounded-xl border border-subtle bg-layer-1 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-subtle bg-layer-2 px-5 py-5 sm:flex-row sm:items-center sm:gap-5">
          <Controller
            control={control}
            name="logo_props"
            render={({ field: { value, onChange } }) => (
              <EmojiPicker
                iconType="material"
                isOpen={isEmojiPickerOpen}
                handleToggle={setIsEmojiPickerOpen}
                label={
                  <span
                    className={cn(
                      "grid size-16 shrink-0 place-items-center rounded-lg border bg-layer-1 shadow-sm transition-colors",
                      issueFormControlBorderClass,
                      "hover:border-strong-1"
                    )}
                  >
                    <Logo logo={value} size={32} />
                  </span>
                }
                onChange={(val) => {
                  const logoValue = val.type === EmojiIconPickerTypes.EMOJI ? { value: val.value } : val.value;
                  onChange({
                    in_use: val.type,
                    [val.type]: logoValue,
                  } as TLogoProps);
                  setIsEmojiPickerOpen(false);
                }}
              />
            )}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-16 font-semibold text-primary">{watchedName || board.name}</p>
            <button
              type="button"
              onClick={() => setIsEmojiPickerOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 text-12 font-medium text-accent-primary transition-opacity hover:opacity-80"
            >
              <ImageIcon className="size-3.5" />
              {t("boards.settings.change_icon")}
            </button>
          </div>
        </div>

        <div className="space-y-6 px-5 py-5">
          <section className="space-y-4">
            <h4 className="text-12 font-semibold uppercase tracking-wide text-tertiary">
              {t("boards.settings.informations_section_details")}
            </h4>

            <Controller
              control={control}
              name="name"
              rules={{
                required: t("name_is_required"),
                maxLength: { value: 255, message: t("title_should_be_less_than_255_characters") },
              }}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <FieldLabel required>{t("boards.name_label")}</FieldLabel>
                  <Input
                    {...field}
                    placeholder={t("boards.name_placeholder")}
                    hasError={Boolean(errors.name)}
                    className={cn("w-full", issueFormControlBaseClass)}
                  />
                  {errors.name && (
                    <p className="text-11 text-danger-primary">{String(errors.name.message ?? "")}</p>
                  )}
                </div>
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <div className="space-y-1.5">
                  <FieldLabel>{t("description")}</FieldLabel>
                  <TextArea
                    {...field}
                    placeholder={t("boards.description_placeholder")}
                    rows={4}
                    className={cn(
                      "w-full resize-y rounded-[3px] bg-layer-2 px-2.5 py-2 text-13 text-primary shadow-sm outline-none transition-[border-color,box-shadow]",
                      issueFormControlBorderClass,
                      "focus:border-accent-primary focus:shadow-[0_0_0_1px_var(--border-color-accent-strong)]"
                    )}
                  />
                </div>
              )}
            />
          </section>

          <section className="space-y-4 border-t border-subtle pt-6">
            <h4 className="text-12 font-semibold uppercase tracking-wide text-tertiary">
              {t("boards.settings.informations_section_team")}
            </h4>

            <Controller
              control={control}
              name="board_lead"
              render={({ field: { value, onChange } }) => (
                <div className="space-y-1.5">
                  <FieldLabel>{t("boards.settings.board_owner")}</FieldLabel>
                  <WorkspaceMemberSelect
                    workspaceSlug={workspaceSlug}
                    value={value}
                    onChange={onChange}
                    selectedMemberFromApi={
                      typeof board.board_lead === "object" ? board.board_lead : null
                    }
                    isDisabled={!isAdmin}
                  />
                  <p className="text-11 leading-relaxed text-tertiary">
                    {t("boards.settings.board_owner_hint")}
                  </p>
                </div>
              )}
            />

            <Controller
              control={control}
              name="default_assignee"
              render={({ field: { value, onChange } }) => (
                <div className="space-y-1.5">
                  <FieldLabel>{t("boards.settings.default_assignee")}</FieldLabel>
                  <WorkspaceMemberSelect
                    workspaceSlug={workspaceSlug}
                    value={value}
                    onChange={onChange}
                    selectedMemberFromApi={
                      typeof board.default_assignee === "object" ? board.default_assignee : null
                    }
                    isDisabled={!isAdmin}
                  />
                  <p className="text-11 leading-relaxed text-tertiary">
                    {t("boards.settings.default_assignee_hint")}
                  </p>
                </div>
              )}
            />
          </section>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-subtle bg-layer-2 px-5 py-4">
          <p className="text-11 text-tertiary">
            {canSave ? t("boards.settings.unsaved_changes") : t("boards.settings.all_changes_saved")}
          </p>
          <Button variant="primary" type="submit" loading={isSubmitting} disabled={!canSave}>
            {t("save_changes")}
          </Button>
        </div>
      </div>
    </form>
  );
}
