import { useEffect, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  AlignLeft,
  CheckCircle2,
  Hash,
  LayoutGrid,
  Palette,
  Pencil,
  Save,
  Sparkles,
  Tag,
  UserCheck,
  UserCog,
  Users,
} from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import { Button } from "@operoz/propel/button";
import { EmojiPicker, EmojiIconPickerTypes, Logo } from "@operoz/propel/emoji-icon-picker";
import { EUserPermissions, EUserPermissionsLevel } from "@operoz/constants";
import type { IBoard, IUserLite, TBoardFormData, TLogoProps } from "@operoz/types";
import { Input, TextArea, cn } from "@operoz/ui";
import { WorkspaceMemberSelect } from "@/components/workspace/workspace-member-select";
import { useBoard } from "@/hooks/store/use-board";
import { useUserPermissions } from "@/hooks/store/user";
import {
  issueFormControlBaseClass,
  issueFormControlBorderClass,
} from "@/plane-web/components/issues/issue-modal/issue-form-field";
import "./board-informations-settings.css";

type Props = {
  workspaceSlug: string;
  board: IBoard;
};

type SectionTone = "accent" | "success" | "warning";

function SectionHeading(props: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  subtitle?: string;
  tone?: SectionTone;
}) {
  const { icon: Icon, title, subtitle, tone = "accent" } = props;

  return (
    <div className="board-informations-section-heading">
      <span className="board-informations-section-icon" data-tone={tone}>
        <Icon className="size-3.5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        {subtitle && <p className="board-informations-section-eyebrow">{subtitle}</p>}
        <h4 className="text-13 font-semibold tracking-tight text-primary">{title}</h4>
      </div>
    </div>
  );
}

function FieldLabel(props: {
  children: ReactNode;
  required?: boolean;
  hint?: string;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  spaced?: boolean;
}) {
  const { children, required, hint, icon: Icon, spaced } = props;

  return (
    <div className={cn("flex flex-col", spaced ? "gap-2" : "gap-0.5")}>
      <p className="flex items-center gap-1.5 text-12 font-medium text-primary">
        {Icon && <Icon className="size-3.5 text-tertiary" strokeWidth={1.75} />}
        {children}
        {required ? <span className="text-danger-primary"> *</span> : null}
      </p>
      {hint && <p className="text-11 leading-relaxed text-tertiary">{hint}</p>}
    </div>
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
    user && typeof user === "object" ? user.id : (user ?? null);

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
  const watchedLogo = watch("logo_props");
  const canSave = isDirty;
  const boardLeadId = toMemberId(board.board_lead);
  const defaultAssigneeId = toMemberId(board.default_assignee);

  const highlights = [
    { icon: Palette, label: t("boards.settings.hero.highlights.identity") },
    { icon: Users, label: t("boards.settings.hero.highlights.team") },
    { icon: LayoutGrid, label: t("boards.settings.hero.highlights.defaults") },
  ];

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
      const boardLead = data.board_lead === "none" || !data.board_lead ? null : data.board_lead;
      const defaultAssignee = data.default_assignee === "none" || !data.default_assignee ? null : data.default_assignee;
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
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-full">
      <div className="board-informations-split-grid">
        <section className="board-informations-panel board-informations-identity-panel">
          <header className="board-informations-panel-header board-informations-hero-dot-grid">
            <SectionHeading
              icon={Sparkles}
              title={t("boards.settings.informations_section_identity")}
              subtitle={t("boards.settings.informations_eyebrow")}
              tone="accent"
            />
          </header>

          <div className="board-informations-panel-body">
            <div className="board-informations-identity-stage">
              <span className="board-informations-logo-orbit" aria-hidden />
              <span className="board-informations-logo-glow" aria-hidden />

              <Controller
                control={control}
                name="logo_props"
                render={({ field: { value, onChange } }) => (
                  <EmojiPicker
                    iconType="material"
                    isOpen={isEmojiPickerOpen}
                    handleToggle={setIsEmojiPickerOpen}
                    label={
                      <span className="board-informations-logo-btn" aria-label={t("boards.settings.change_icon")}>
                        <span className="board-informations-logo-frame board-informations-logo-frame-lg">
                          <Logo logo={watchedLogo ?? value} size={48} />
                          <span className="board-informations-logo-overlay">
                            <Pencil className="size-4 text-on-color" strokeWidth={1.75} />
                            <span className="text-10 leading-tight font-medium text-on-color">
                              {t("boards.settings.change_icon")}
                            </span>
                          </span>
                        </span>
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

              <div className="board-informations-name-block mt-6">
                <span className="board-informations-section-eyebrow">Board</span>
                <h2 className="max-w-full truncate text-18 font-semibold tracking-tight text-primary">
                  {watchedName || board.name}
                </h2>
                <span className="board-informations-slug-pill">
                  <Hash className="size-2.5 opacity-70" strokeWidth={2} />
                  {board.slug}
                </span>
                <p className="mt-1 max-w-[16rem] text-12 leading-relaxed text-secondary">
                  {t("boards.settings.informations_description")}
                </p>
              </div>
            </div>
          </div>

          <footer className="board-informations-panel-footer">
            <ul className="board-informations-highlight-list">
              {highlights.map((item) => (
                <li key={item.label} className="board-informations-highlight-item">
                  <item.icon className="size-3.5 shrink-0 text-accent-primary" strokeWidth={1.75} />
                  {item.label}
                </li>
              ))}
            </ul>
          </footer>
        </section>

        <section className="board-informations-panel board-informations-settings-panel">
          <header className="board-informations-panel-header board-informations-hero-dot-grid">
            <SectionHeading
              icon={LayoutGrid}
              title={t("boards.settings.informations_section_details")}
              subtitle={t("boards.settings.informations_eyebrow")}
              tone="success"
            />
          </header>

          <div className="board-informations-panel-body gap-5 px-5 py-5 lg:px-6 lg:py-6">
            <div className="flex flex-col gap-4">
              <Controller
                control={control}
                name="name"
                rules={{
                  required: t("name_is_required"),
                  maxLength: { value: 255, message: t("title_should_be_less_than_255_characters") },
                }}
                render={({ field }) => (
                  <div className="board-informations-field-group">
                    <FieldLabel required icon={Tag}>
                      {t("boards.name_label")}
                    </FieldLabel>
                    <Input
                      {...field}
                      placeholder={t("boards.name_placeholder")}
                      hasError={Boolean(errors.name)}
                      className={cn("h-9 w-full border-0 bg-transparent shadow-none", issueFormControlBaseClass)}
                    />
                    {errors.name && <p className="text-11 text-danger-primary">{String(errors.name.message ?? "")}</p>}
                  </div>
                )}
              />

              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <div className="board-informations-field-group board-informations-description-field">
                    <FieldLabel icon={AlignLeft}>{t("description")}</FieldLabel>
                    <TextArea
                      {...field}
                      placeholder={t("boards.description_placeholder")}
                      rows={6}
                      className={cn(
                        "board-informations-description-textarea w-full resize-y rounded-md border-0 bg-transparent px-0 py-1 text-13 text-primary shadow-none outline-none",
                        issueFormControlBorderClass,
                        "focus:border-transparent focus:shadow-none"
                      )}
                    />
                  </div>
                )}
              />
            </div>

            <div className="board-informations-team-divider space-y-4">
              <SectionHeading icon={Users} title={t("boards.settings.informations_section_team")} tone="warning" />

              <div className="board-informations-team-fields">
                <Controller
                  control={control}
                  name="board_lead"
                  render={({ field: { value, onChange } }) => (
                    <div className="board-informations-team-field">
                      <div className="board-informations-team-field-label">
                        <FieldLabel spaced hint={t("boards.settings.board_owner_hint")} icon={UserCog}>
                          {t("boards.settings.board_owner")}
                        </FieldLabel>
                      </div>
                      <div className="board-informations-team-field-control">
                        <WorkspaceMemberSelect
                          workspaceSlug={workspaceSlug}
                          value={value}
                          onChange={onChange}
                          selectedMemberFromApi={typeof board.board_lead === "object" ? board.board_lead : null}
                          isDisabled={!isAdmin}
                        />
                      </div>
                    </div>
                  )}
                />

                <Controller
                  control={control}
                  name="default_assignee"
                  render={({ field: { value, onChange } }) => (
                    <div className="board-informations-team-field">
                      <div className="board-informations-team-field-label">
                        <FieldLabel spaced hint={t("boards.settings.default_assignee_hint")} icon={UserCheck}>
                          {t("boards.settings.default_assignee")}
                        </FieldLabel>
                      </div>
                      <div className="board-informations-team-field-control">
                        <WorkspaceMemberSelect
                          workspaceSlug={workspaceSlug}
                          value={value}
                          onChange={onChange}
                          selectedMemberFromApi={
                            typeof board.default_assignee === "object" ? board.default_assignee : null
                          }
                          isDisabled={!isAdmin}
                        />
                      </div>
                    </div>
                  )}
                />
              </div>
            </div>
          </div>

          <footer className="board-informations-panel-footer board-informations-form-footer">
            <span className="board-informations-status-pill" data-state={canSave ? "dirty" : "saved"}>
              {!canSave && <CheckCircle2 className="size-3.5" strokeWidth={1.75} />}
              {canSave ? t("boards.settings.unsaved_changes") : t("boards.settings.all_changes_saved")}
            </span>
            <Button
              variant="primary"
              type="submit"
              loading={isSubmitting}
              disabled={!canSave}
              prependIcon={<Save className="size-3.5" strokeWidth={1.75} />}
            >
              {t("save_changes")}
            </Button>
          </footer>
        </section>
      </div>
    </form>
  );
}
