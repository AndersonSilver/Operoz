"use client";

import { useCallback, useMemo, useState } from "react";
import { FileText, Link2, ShieldCheck } from "lucide-react";
import useSWR from "swr";
import { SPACE_BASE_PATH, SPACE_BASE_URL } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { IBoard, TBoardIntakeForm, TIntakeFormField } from "@operis/types";
import { BOARD_INTAKE_FORM_THEMES } from "@operis/types";

type BoardIntakeFormTheme = (typeof BOARD_INTAKE_FORM_THEMES)[number]["value"];
import { Input, ModalCore, TextArea, ToggleSwitch, EModalWidth } from "@operis/ui";
import { cn } from "@operis/utils";
import { boardIntakeFormService, DEFAULT_BOARD_INTAKE_FIELDS } from "@/services/board/board-intake-form.service";
import { IntakeFormBuilderCanvas } from "@/components/intake/forms/intake-form-builder-canvas";
import { IntakeFormBuilderSidebar } from "@/components/intake/forms/intake-form-builder-sidebar";
import { IntakeFormFieldDrawer } from "@/components/intake/forms/intake-form-field-drawer";
import { IntakeFormGrid } from "@/components/intake/forms/intake-form-grid";
import { copyTextToClipboard } from "@operis/utils";
import { Loader } from "@operis/ui";
import { SupportSettingsHero } from "@/components/settings/board/support/support-settings-hero";
import "@/components/intake/forms/intake-settings.css";

function buildPublicFormUrl(anchor: string): string {
  const base =
    (SPACE_BASE_URL.trim() || (typeof window !== "undefined" ? window.location.origin : "")) + SPACE_BASE_PATH;
  return `${base.replace(/\/$/, "")}/forms/${anchor}`;
}

type EditorProps = {
  workspaceSlug: string;
  boardSlug: string;
  form: TBoardIntakeForm | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

type DrawerState = { mode: "create" } | { mode: "edit"; fieldId: string } | null;

function BoardIntakeFormEditorModal(props: EditorProps) {
  const { workspaceSlug, boardSlug, form, onClose, onSaved } = props;
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(form?.name ?? "");
  const [headerTitle, setHeaderTitle] = useState(form?.header_title ?? "");
  const [description, setDescription] = useState(form?.description ?? "");
  const [submitMessage, setSubmitMessage] = useState(form?.submit_message ?? "");
  const [isPublished, setIsPublished] = useState(form?.is_published ?? false);
  const [requireAuth, setRequireAuth] = useState(form?.require_auth ?? false);
  const [theme, setTheme] = useState<BoardIntakeFormTheme>(form?.theme ?? "default");
  const [fields, setFields] = useState<TIntakeFormField[]>(form?.fields ?? DEFAULT_BOARD_INTAKE_FIELDS ?? []);
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  const editingField = useMemo(
    () => (drawer?.mode === "edit" ? (fields.find((field) => field.id === drawer.fieldId) ?? null) : null),
    [drawer, fields]
  );

  const updateField = useCallback((fieldId: string, patch: Partial<TIntakeFormField>) => {
    setFields((current) => current.map((field) => (field.id === fieldId ? { ...field, ...patch } : field)));
  }, []);

  const removeField = useCallback(
    (fieldId: string) => {
      const target = fields.find((field) => field.id === fieldId);
      if (target?.field_type === "client") {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: t("boards.settings.intake_forms.client_field_locked"),
        });
        return;
      }
      setFields((current) => current.filter((field) => field.id !== fieldId));
      setSelectedFieldId((current) => (current === fieldId ? null : current));
    },
    [fields, t]
  );

  const moveField = useCallback((fieldId: string, direction: "up" | "down") => {
    setFields((current) => {
      const index = current.findIndex((field) => field.id === fieldId);
      if (index < 0) return current;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("project_settings.features.intake.forms.name_required"),
      });
      return;
    }
    if (!fields.some((field) => field.field_type === "client")) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("boards.settings.intake_forms.client_field_locked"),
      });
      return;
    }
    if (!fields.some((field) => field.field_type === "name")) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("project_settings.features.intake.forms.summary_required"),
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        header_title: headerTitle.trim(),
        description: description.trim(),
        submit_message: submitMessage.trim(),
        is_published: isPublished,
        require_auth: requireAuth,
        theme,
        fields,
        defaults: {},
      };
      if (form?.id) {
        await boardIntakeFormService.update(workspaceSlug, boardSlug, form.id, payload);
      } else {
        await boardIntakeFormService.create(workspaceSlug, boardSlug, payload);
      }
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.settings.intake_forms.saved"),
      });
      await onSaved();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalCore isOpen handleClose={onClose} width={EModalWidth.VIIXL}>
      <div className="flex h-[88vh] max-h-[900px] flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-between border-b border-subtle bg-surface-1 px-6 py-4">
          <div>
            <h2 className="text-16 font-semibold text-primary">
              {form ? form.name : t("boards.settings.intake_forms.create")}
            </h2>
            <p className="mt-0.5 text-12 text-tertiary">{t("boards.settings.intake_forms.subtitle")}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="h-9" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" className="h-9" loading={saving} onClick={() => void handleSave()}>
              {t("save")}
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="min-w-0 flex-1 overflow-y-auto bg-canvas px-6 py-5">
            <div className="mx-auto max-w-3xl space-y-4">
              <div className="grid gap-4 rounded-xl border border-subtle bg-surface-1 p-4">
                <div className="space-y-2">
                  <label className="text-11 font-semibold text-secondary uppercase">{t("common.name")}</label>
                  <Input className="h-10 bg-layer-1" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-11 font-semibold text-secondary uppercase">
                    {t("boards.settings.intake_forms.theme_label")}
                  </label>
                  <select
                    className="h-10 w-full rounded-md border border-subtle bg-layer-1 px-3 text-13"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as BoardIntakeFormTheme)}
                  >
                    {BOARD_INTAKE_FORM_THEMES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-11 font-semibold text-secondary uppercase">
                    {t("project_settings.features.intake.forms.header_title")}
                  </label>
                  <Input
                    className="h-10 bg-layer-1"
                    value={headerTitle}
                    onChange={(e) => setHeaderTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-11 font-semibold text-secondary uppercase">{t("common.description")}</label>
                  <TextArea
                    className="bg-layer-1"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <IntakeFormBuilderCanvas
                fields={fields}
                selectedFieldId={selectedFieldId}
                headerTitle={headerTitle}
                formDescription={description}
                onSelectField={(fieldId) => {
                  setSelectedFieldId(fieldId);
                  setDrawer({ mode: "edit", fieldId });
                }}
                onMoveField={moveField}
              />

              <div className="space-y-3 rounded-xl border border-subtle bg-surface-1 p-4">
                <Input
                  className="h-10 bg-layer-1"
                  value={submitMessage}
                  onChange={(e) => setSubmitMessage(e.target.value)}
                  placeholder={t("project_settings.features.intake.forms.submit_message")}
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-lg border border-subtle px-3 py-2">
                    <span className="text-13">{t("project_settings.features.intake.forms.publish")}</span>
                    <ToggleSwitch value={isPublished} onChange={setIsPublished} size="sm" />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-subtle px-3 py-2">
                    <span className="text-13">{t("project_settings.features.intake.forms.require_auth")}</span>
                    <ToggleSwitch value={requireAuth} onChange={setRequireAuth} size="sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside
            className={cn(
              "flex w-[360px] shrink-0 flex-col border-l border-subtle bg-surface-1",
              drawer && "shadow-raised-100"
            )}
          >
            {drawer ? (
              <IntakeFormFieldDrawer
                mode={drawer.mode}
                field={drawer.mode === "edit" ? editingField : null}
                onClose={() => setDrawer(null)}
                onCreate={(field) => {
                  setFields((current) => [...current, field]);
                  setSelectedFieldId(field.id);
                }}
                onUpdate={updateField}
                onDelete={removeField}
              />
            ) : (
              <IntakeFormBuilderSidebar
                customFields={[]}
                usedCustomFieldIds={new Set()}
                onAddCustomField={() => undefined}
                onCreateField={() => setDrawer({ mode: "create" })}
              />
            )}
          </aside>
        </div>
      </div>
    </ModalCore>
  );
}

export function BoardIntakeFormsSettings(props: { workspaceSlug: string; board: IBoard }) {
  const { workspaceSlug, board } = props;
  const { t } = useTranslation();
  const [editorForm, setEditorForm] = useState<TBoardIntakeForm | null | "new">(null);
  const [creating, setCreating] = useState(false);

  const {
    data: forms = [],
    mutate,
    isLoading,
    error,
  } = useSWR(`BOARD_INTAKE_FORMS_${workspaceSlug}_${board.slug}`, () =>
    boardIntakeFormService.list(workspaceSlug, board.slug)
  );

  const sortedForms = useMemo(
    () =>
      [...forms].sort((a, b) => (b.updated_at ?? b.created_at ?? "").localeCompare(a.updated_at ?? a.created_at ?? "")),
    [forms]
  );

  const handleCreate = useCallback(async () => {
    setCreating(true);
    try {
      const created = await boardIntakeFormService.create(workspaceSlug, board.slug, {
        name: t("project_settings.features.intake.forms.default_name"),
        header_title: t("project_settings.features.intake.forms.default_header"),
        fields: DEFAULT_BOARD_INTAKE_FIELDS,
        theme: "default",
        defaults: {},
        submit_message: t("project_settings.features.intake.forms.default_submit_message"),
      });
      await mutate();
      setEditorForm(created);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.settings.intake_forms.created"),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setCreating(false);
    }
  }, [board.slug, mutate, t, workspaceSlug]);

  const handleDelete = useCallback(
    async (form: TBoardIntakeForm) => {
      if (!window.confirm(t("boards.settings.intake_forms.delete_confirm"))) return;
      try {
        await boardIntakeFormService.remove(workspaceSlug, board.slug, form.id);
        await mutate();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("toast.success"),
          message: t("boards.settings.intake_forms.deleted"),
        });
      } catch {
        setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
      }
    },
    [board.slug, mutate, t, workspaceSlug]
  );

  const handleCopyLink = useCallback(
    (form: TBoardIntakeForm) => {
      if (!form.is_published) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: t("project_settings.features.intake.forms.publish_before_copy"),
        });
        return;
      }
      void copyTextToClipboard(buildPublicFormUrl(form.anchor)).then(() =>
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("toast.success"),
          message: t("project_settings.features.intake.forms.link_copied"),
        })
      );
    },
    [t]
  );

  return (
    <div className="space-y-6">
      <SupportSettingsHero
        icon={FileText}
        title={t("boards.settings.intake_forms.title")}
        description={t("boards.settings.intake_forms.subtitle")}
        createLabel={t("boards.settings.intake_forms.create")}
        creating={creating}
        onCreate={() => void handleCreate()}
        highlights={[
          { label: t("boards.settings.intake_forms.highlight_public"), icon: Link2, tone: "accent" },
          { label: t("boards.settings.intake_forms.highlight_client"), icon: ShieldCheck, tone: "success" },
        ]}
      />

      {isLoading ? (
        <Loader className="space-y-2">
          <Loader.Item height="56px" />
          <Loader.Item height="56px" />
        </Loader>
      ) : error ? (
        <div className="rounded-xl border border-danger-subtle bg-danger-subtle px-5 py-4 text-13 text-danger-primary">
          {t("boards.settings.intake_forms.load_error")}
        </div>
      ) : sortedForms.length === 0 ? (
        <IntakeFormGrid<TBoardIntakeForm>
          forms={[]}
          buildUrl={buildPublicFormUrl}
          i18nPrefix="boards.settings.intake_forms"
          creating={creating}
          onCreate={() => void handleCreate()}
          onEdit={setEditorForm}
          onCopyLink={handleCopyLink}
          onDelete={(form) => void handleDelete(form)}
        />
      ) : (
        <IntakeFormGrid<TBoardIntakeForm>
          forms={sortedForms}
          buildUrl={buildPublicFormUrl}
          i18nPrefix="boards.settings.intake_forms"
          creating={creating}
          onCreate={() => void handleCreate()}
          onEdit={setEditorForm}
          onCopyLink={handleCopyLink}
          onDelete={(form) => void handleDelete(form)}
        />
      )}

      {editorForm ? (
        <BoardIntakeFormEditorModal
          workspaceSlug={workspaceSlug}
          boardSlug={board.slug}
          form={editorForm === "new" ? null : editorForm}
          onClose={() => setEditorForm(null)}
          onSaved={async () => {
            await mutate();
            setEditorForm(null);
          }}
        />
      ) : null}
    </div>
  );
}
