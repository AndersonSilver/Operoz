import { useCallback, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import useSWR from "swr";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { IBoardCustomField, TIntakeForm, TIntakeFormField } from "@operis/types";
import { Input, ModalCore, TextArea, ToggleSwitch, EModalWidth } from "@operis/ui";
import { cn } from "@operis/utils";
import { ModuleDropdown } from "@/components/dropdowns/module/dropdown";
import { intakeFormService } from "@/services/intake/intake-form.service";
import { BoardCustomFieldService } from "@/services/board/board-custom-field.service";
import { IntakeFormBuilderCanvas } from "./intake-form-builder-canvas";
import { IntakeFormBuilderSidebar } from "./intake-form-builder-sidebar";
import { IntakeFormFieldDrawer } from "./intake-form-field-drawer";
import {
  createIntakeFormFieldFromCustomField,
  fromBoardCustomField,
  fromWorkspaceCustomField,
  type TIntakeSelectableCustomField,
} from "./intake-form-field-catalog";

const boardFieldService = new BoardCustomFieldService();

type Props = {
  workspaceSlug: string;
  projectId: string;
  boardSlug?: string;
  form: TIntakeForm | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

type DrawerState = { mode: "create" } | { mode: "edit"; fieldId: string } | null;

function CollapsibleSection(props: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(props.defaultOpen ?? true);
  return (
    <section className="overflow-hidden rounded-xl border border-subtle bg-surface-1">
      <button
        type="button"
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-layer-transparent-hover"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="mt-0.5 text-tertiary">
          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-13 font-semibold text-primary">{props.title}</span>
          {props.description ? <span className="mt-0.5 block text-12 text-secondary">{props.description}</span> : null}
        </span>
      </button>
      {open ? <div className="border-t border-subtle px-4 py-4">{props.children}</div> : null}
    </section>
  );
}

export function IntakeFormEditorModal(props: Props) {
  const { workspaceSlug, projectId, boardSlug, form, onClose, onSaved } = props;
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(form?.name ?? "");
  const [headerTitle, setHeaderTitle] = useState(form?.header_title ?? "");
  const [description, setDescription] = useState(form?.description ?? "");
  const [submitMessage, setSubmitMessage] = useState(form?.submit_message ?? "");
  const [isPublished, setIsPublished] = useState(form?.is_published ?? false);
  const [requireAuth, setRequireAuth] = useState(form?.require_auth ?? false);
  const [fields, setFields] = useState<TIntakeFormField[]>(form?.fields ?? []);
  const [moduleIds, setModuleIds] = useState<string[]>(() => {
    const raw = form?.defaults?.module_ids;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : [String(raw)];
  });
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  const { data: selectableCustomFields = [] } = useSWR(
    workspaceSlug ? `INTAKE_FORM_SELECTABLE_FIELDS_${workspaceSlug}_${boardSlug ?? "workspace"}` : null,
    async () => {
      const [workspaceFields, boardFields] = await Promise.all([
        boardFieldService.getWorkspaceCustomFields(workspaceSlug),
        boardSlug ? boardFieldService.getBoardCustomFields(workspaceSlug, boardSlug) : Promise.resolve([]),
      ]);

      const merged = new Map<string, TIntakeSelectableCustomField>();

      workspaceFields
        .filter((field) => field.is_active)
        .forEach((field) => merged.set(field.id, fromWorkspaceCustomField(field)));

      (boardFields as IBoardCustomField[])
        .filter((field) => field.is_enabled && field.custom_field_id && !field.is_system)
        .forEach((field) => {
          const selectable = fromBoardCustomField(field);
          if (selectable) merged.set(selectable.custom_field_id, selectable);
        });

      return Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name));
    }
  );

  const usedCustomFieldIds = useMemo(
    () => new Set(fields.map((field) => field.custom_field_id).filter(Boolean) as string[]),
    [fields]
  );

  const editingField = useMemo(
    () => (drawer?.mode === "edit" ? fields.find((field) => field.id === drawer.fieldId) ?? null : null),
    [drawer, fields]
  );

  const addSelectableField = useCallback((customField: TIntakeSelectableCustomField) => {
    const next = createIntakeFormFieldFromCustomField(customField);
    setFields((current) => [...current, next]);
    setSelectedFieldId(next.id);
    setDrawer({ mode: "edit", fieldId: next.id });
  }, []);

  const updateField = useCallback((fieldId: string, patch: Partial<TIntakeFormField>) => {
    setFields((current) => current.map((field) => (field.id === fieldId ? { ...field, ...patch } : field)));
  }, []);

  const removeField = useCallback((fieldId: string) => {
    setFields((current) => current.filter((field) => field.id !== fieldId));
    setSelectedFieldId((current) => (current === fieldId ? null : current));
  }, []);

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
        fields,
        defaults: { module_ids: moduleIds },
      };
      if (form?.id) {
        await intakeFormService.update(workspaceSlug, projectId, form.id, payload);
      } else {
        await intakeFormService.create(workspaceSlug, projectId, payload);
      }
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("project_settings.features.intake.forms.saved"),
      });
      await onSaved();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("something_went_wrong"),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalCore isOpen handleClose={onClose} width={EModalWidth.VIIXL}>
      <div className="flex h-[88vh] max-h-[900px] flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-between border-b border-subtle bg-surface-1 px-6 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-16 font-semibold text-primary">
              {form
                ? t("project_settings.features.intake.forms.edit_title")
                : t("project_settings.features.intake.forms.create_title")}
            </h2>
            <p className="mt-0.5 text-12 text-tertiary">
              {t("project_settings.features.intake.forms.builder.subtitle")}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
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
              <CollapsibleSection
                title={t("project_settings.features.intake.forms.builder.form_details_section")}
                description={t("project_settings.features.intake.forms.builder.form_details_hint")}
                defaultOpen
              >
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <label className="text-11 font-semibold tracking-wide text-secondary uppercase">
                      {t("common.name")}
                    </label>
                    <Input className="h-10 bg-layer-1" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-11 font-semibold tracking-wide text-secondary uppercase">
                      {t("project_settings.features.intake.forms.header_title")}
                    </label>
                    <Input
                      className="h-10 bg-layer-1"
                      value={headerTitle}
                      onChange={(e) => setHeaderTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-11 font-semibold tracking-wide text-secondary uppercase">
                      {t("common.description")}
                    </label>
                    <TextArea
                      className="bg-layer-1"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              </CollapsibleSection>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-13 font-semibold text-primary">
                      {t("project_settings.features.intake.forms.builder.canvas_title")}
                    </h3>
                    <p className="mt-0.5 text-12 text-tertiary">
                      {t("project_settings.features.intake.forms.builder.canvas_hint")}
                    </p>
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
              </div>

              <CollapsibleSection
                title={t("project_settings.features.intake.forms.builder.publishing_section")}
                description={t("project_settings.features.intake.forms.defaults_hint")}
                defaultOpen={false}
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-11 font-semibold tracking-wide text-secondary uppercase">
                      {t("project_settings.features.intake.forms.default_module")}
                    </label>
                    <ModuleDropdown
                      projectId={projectId}
                      value={moduleIds}
                      onChange={setModuleIds}
                      multiple
                      buttonVariant="border-with-text"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-11 font-semibold tracking-wide text-secondary uppercase">
                      {t("project_settings.features.intake.forms.submit_message")}
                    </label>
                    <Input
                      className="h-10 bg-layer-1"
                      value={submitMessage}
                      onChange={(e) => setSubmitMessage(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="flex items-center justify-between rounded-lg border border-subtle bg-layer-1 px-3 py-2.5">
                      <div>
                        <p className="text-13 font-medium text-primary">
                          {t("project_settings.features.intake.forms.publish")}
                        </p>
                        <p className="text-11 text-tertiary">
                          {t("project_settings.features.intake.forms.builder.publish_hint")}
                        </p>
                      </div>
                      <ToggleSwitch value={isPublished} onChange={setIsPublished} size="sm" />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-subtle bg-layer-1 px-3 py-2.5">
                      <div>
                        <p className="text-13 font-medium text-primary">
                          {t("project_settings.features.intake.forms.require_auth")}
                        </p>
                        <p className="text-11 text-tertiary">
                          {t("project_settings.features.intake.forms.builder.require_auth_hint")}
                        </p>
                      </div>
                      <ToggleSwitch value={requireAuth} onChange={setRequireAuth} size="sm" />
                    </div>
                  </div>
                </div>
              </CollapsibleSection>
            </div>
          </div>

          <aside
            className={cn(
              "flex w-[360px] shrink-0 flex-col border-l border-subtle bg-surface-1",
              drawer ? "shadow-raised-100" : ""
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
                customFields={selectableCustomFields}
                usedCustomFieldIds={usedCustomFieldIds}
                onAddCustomField={addSelectableField}
                onCreateField={() => setDrawer({ mode: "create" })}
              />
            )}
          </aside>
        </div>
      </div>
    </ModalCore>
  );
}
