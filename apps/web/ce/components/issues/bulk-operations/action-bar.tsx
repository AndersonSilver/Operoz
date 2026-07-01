import { useCallback, useMemo, useState, type ReactNode } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { EUserPermissionsLevel } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { ArchiveIcon, CloseIcon, TrashIcon } from "@operoz/propel/icons";
import { Logo } from "@operoz/propel/emoji-icon-picker";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { TBulkIssueProperties, TBulkOperationsPayload } from "@operoz/types";
import { EUserPermissions } from "@operoz/types";
import { CustomSelect } from "@operoz/ui";
import { cn, renderFormattedPayloadDate } from "@operoz/utils";
import { CycleDropdown } from "@/components/dropdowns/cycle";
import { DateDropdown } from "@/components/dropdowns/date";
import type { TButtonVariants } from "@/components/dropdowns/types";
import { EstimateDropdown } from "@/components/dropdowns/estimate";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { ModuleDropdown } from "@/components/dropdowns/module/dropdown";
import { PriorityDropdown } from "@/components/dropdowns/priority";
import { StateDropdown } from "@/components/dropdowns/state/dropdown";
import { IssuePropertyLabels } from "@/components/issues/issue-layouts/properties";
import {
  PROJECT_HUB_TOOLBAR_BUTTON_CLASS,
  PROJECT_HUB_TOOLBAR_SEGMENT,
  PROJECT_HUB_TOOLBAR_SHELL,
  ProjectHubToolbarDivider,
} from "@/components/project/project-hub-toolbar";
import { useBoardIssueType } from "@/hooks/store/use-board-issue-type";
import { useMultipleSelectStore } from "@/hooks/store/use-multiple-select-store";
import { useProject } from "@/hooks/store/use-project";
import { useIssues } from "@/hooks/store/use-issues";
import { useUserPermissions } from "@/hooks/store/user";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import type { TSelectionHelper } from "@/hooks/use-multiple-select";

type Props = {
  className?: string;
  selectionHelpers: TSelectionHelper;
};

type TBulkDraft = Partial<TBulkIssueProperties>;
type TBulkDraftKeys = keyof TBulkDraft;

const BULK_DROPDOWN_VARIANT: TButtonVariants = "border-with-text";

const BULK_FIELD_WIDTH_CLASS = "w-[8.75rem]";

const BULK_DROPDOWN_SHELL_CLASS = "h-8 w-full";

const BULK_CHIP_BORDER_CLASS =
  "border-[0.5px] border-subtle bg-layer-2/55 shadow-xs transition-colors hover:border-strong/80 hover:bg-layer-2/75";

const BULK_ACTION_BUTTON_CLASS = cn(
  PROJECT_HUB_TOOLBAR_BUTTON_CLASS,
  BULK_CHIP_BORDER_CLASS,
  "bg-layer-2/40 hover:bg-layer-2/70"
);

const BULK_DROPDOWN_INNER_BUTTON_CLASS = cn(
  "h-full w-full min-w-0 !border-0 !bg-transparent px-2 shadow-none",
  "text-12 font-medium text-secondary hover:!bg-transparent"
);

const BULK_DROPDOWN_SHARED_PROPS = {
  buttonVariant: BULK_DROPDOWN_VARIANT,
  buttonClassName: BULK_DROPDOWN_INNER_BUTTON_CLASS,
  buttonContainerClassName: "h-full w-full",
  className: BULK_DROPDOWN_SHELL_CLASS,
  renderByDefault: true,
  placement: "bottom-start" as const,
} as const;

function BulkFieldSlot(props: { active?: boolean; children: ReactNode }) {
  const { active = false, children } = props;

  return (
    <div
      className={cn(
        "h-8 shrink-0 overflow-visible rounded-md",
        BULK_CHIP_BORDER_CLASS,
        BULK_FIELD_WIDTH_CLASS,
        active && "border-accent-primary/60 hover:border-accent-primary/70 bg-accent-primary/10"
      )}
    >
      {children}
    </div>
  );
}

export const BulkOperationsActionBar = observer(function BulkOperationsActionBar(props: Props) {
  const { className, selectionHelpers } = props;
  const { workspaceSlug, projectId } = useParams();
  const { t } = useTranslation();
  const storeType = useIssueStoreType();
  const { selectedEntityIds, clearSelection } = useMultipleSelectStore();
  const { currentProjectDetails } = useProject();
  const { allowPermissions } = useUserPermissions();
  const { fetchProjectIssueTypes, getProjectIssueTypes } = useBoardIssueType();
  const {
    issues: { bulkUpdateProperties, archiveBulkIssues, removeBulkIssues },
  } = useIssues(storeType);

  const [draft, setDraft] = useState<TBulkDraft>({});
  const [touched, setTouched] = useState<Set<TBulkDraftKeys>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pid = projectId?.toString();
  const slug = workspaceSlug?.toString();

  useSWR(slug && pid ? `BULK_OPS_ISSUE_TYPES_${slug}_${pid}` : null, () => fetchProjectIssueTypes(slug!, pid!), {
    revalidateOnStale: false,
    revalidateOnFocus: false,
  });

  const issueTypes = pid ? getProjectIssueTypes(pid) : [];
  const selectedCount = selectedEntityIds.length;

  const canEdit = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    slug,
    pid
  );
  const canDelete = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT, slug, pid);

  const setField = useCallback(<K extends TBulkDraftKeys>(key: K, value: TBulkDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => new Set(prev).add(key));
  }, []);

  const propertiesToSend = useMemo((): Partial<TBulkIssueProperties> => {
    const properties: Partial<TBulkIssueProperties> = {};
    if (touched.has("state_id")) properties.state_id = draft.state_id ?? null;
    if (touched.has("priority")) properties.priority = draft.priority ?? null;
    if (touched.has("type_id")) properties.type_id = draft.type_id ?? null;
    if (touched.has("assignee_ids")) properties.assignee_ids = draft.assignee_ids ?? [];
    if (touched.has("label_ids")) properties.label_ids = draft.label_ids ?? [];
    if (touched.has("start_date")) properties.start_date = draft.start_date ?? null;
    if (touched.has("target_date")) properties.target_date = draft.target_date ?? null;
    if (touched.has("cycle_id")) properties.cycle_id = draft.cycle_id ?? null;
    if (touched.has("module_ids")) properties.module_ids = draft.module_ids ?? [];
    if (touched.has("estimate_point")) properties.estimate_point = draft.estimate_point ?? null;
    return properties;
  }, [draft, touched]);

  const hasChanges = touched.size > 0;

  const handleUpdate = async () => {
    if (!slug || !pid || !hasChanges) return;

    setIsSubmitting(true);
    try {
      await bulkUpdateProperties(slug, pid, {
        issue_ids: selectedEntityIds,
        properties: propertiesToSend,
      } satisfies TBulkOperationsPayload);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.success"),
        message: `${selectedCount} ${selectedCount === 1 ? "item atualizado" : "itens atualizados"} com sucesso.`,
      });
      setDraft({});
      setTouched(new Set());
      clearSelection();
      selectionHelpers.handleClearSelection();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error.label"),
        message: "Não foi possível atualizar os itens selecionados. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!slug || !pid || !archiveBulkIssues) return;
    setIsSubmitting(true);
    try {
      await archiveBulkIssues(slug, pid, selectedEntityIds);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.success"),
        message: `${selectedCount} ${selectedCount === 1 ? "item arquivado" : "itens arquivados"}.`,
      });
      clearSelection();
      selectionHelpers.handleClearSelection();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error.label"),
        message: "Não foi possível arquivar os itens selecionados.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!slug || !pid || !canDelete) return;
    if (!window.confirm(`Excluir ${selectedCount} item(ns) selecionado(s)? Esta ação não pode ser desfeita.`)) return;

    setIsSubmitting(true);
    try {
      await removeBulkIssues(slug, pid, selectedEntityIds);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.success"),
        message: `${selectedCount} ${selectedCount === 1 ? "item excluído" : "itens excluídos"}.`,
      });
      clearSelection();
      selectionHelpers.handleClearSelection();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error.label"),
        message: "Não foi possível excluir os itens selecionados.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setDraft({});
    setTouched(new Set());
    clearSelection();
    selectionHelpers.handleClearSelection();
  };

  if (!canEdit) return null;

  const selectedType = issueTypes.find((type) => type.id === draft.type_id);

  return (
    <div className={cn("relative z-30 shrink-0 border-b border-subtle/70 bg-canvas/95 px-3 py-2.5", className)}>
      <div className={cn(PROJECT_HUB_TOOLBAR_SHELL, "w-full flex-wrap gap-y-2")}>
        <div className={cn(PROJECT_HUB_TOOLBAR_SEGMENT, "shrink-0")}>
          <div
            className={cn(
              "flex h-8 items-center gap-2 rounded-md px-2.5",
              BULK_CHIP_BORDER_CLASS,
              "border-accent-primary/40 hover:border-accent-primary/55 bg-accent-primary/12"
            )}
          >
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-primary text-10 font-bold text-on-color tabular-nums">
              {selectedCount}
            </span>
            <span className="text-12 font-semibold whitespace-nowrap text-primary">
              {selectedCount === 1 ? "item selecionado" : "itens selecionados"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={isSubmitting}
            className={cn(BULK_ACTION_BUTTON_CLASS, "text-tertiary hover:text-primary")}
            title="Limpar seleção"
          >
            <CloseIcon className="size-3.5" />
            <span className="hidden sm:inline">Limpar</span>
          </Button>
        </div>

        <ProjectHubToolbarDivider />

        <div
          className={cn(
            PROJECT_HUB_TOOLBAR_SEGMENT,
            "min-w-0 flex-1 gap-1 overflow-x-auto rounded-md p-1",
            BULK_CHIP_BORDER_CLASS,
            "bg-layer-2/25 hover:border-subtle",
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          )}
        >
          <BulkFieldSlot active={touched.has("state_id")}>
            <StateDropdown
              {...BULK_DROPDOWN_SHARED_PROPS}
              value={draft.state_id ?? null}
              onChange={(val) => setField("state_id", val)}
              projectId={pid}
              placeholder="Estado"
              iconSize="size-3.5"
            />
          </BulkFieldSlot>

          <BulkFieldSlot active={touched.has("priority")}>
            <PriorityDropdown
              {...BULK_DROPDOWN_SHARED_PROPS}
              value={draft.priority ?? null}
              onChange={(val) => setField("priority", val)}
              placeholder="Prioridade"
            />
          </BulkFieldSlot>

          {issueTypes.length > 0 && (
            <BulkFieldSlot active={touched.has("type_id")}>
              <CustomSelect
                value={draft.type_id ?? ""}
                onChange={(val: string) => setField("type_id", val || null)}
                placement="bottom-start"
                label={
                  selectedType ? (
                    <span className="flex items-center gap-1.5 text-12 font-medium text-secondary">
                      <Logo logo={selectedType.logo_props} size={14} />
                      <span className="truncate">{selectedType.name}</span>
                    </span>
                  ) : (
                    <span className="text-12 font-medium text-placeholder">Tipo</span>
                  )
                }
                className={cn(
                  BULK_DROPDOWN_SHELL_CLASS,
                  "rounded-none border-0 bg-transparent px-2 text-12 shadow-none hover:bg-transparent"
                )}
              >
                {issueTypes.map((type) => (
                  <CustomSelect.Option key={type.id} value={type.id}>
                    <span className="flex items-center gap-2">
                      <Logo logo={type.logo_props} size={14} />
                      {type.name}
                    </span>
                  </CustomSelect.Option>
                ))}
              </CustomSelect>
            </BulkFieldSlot>
          )}

          <BulkFieldSlot active={touched.has("assignee_ids")}>
            <MemberDropdown
              {...BULK_DROPDOWN_SHARED_PROPS}
              value={draft.assignee_ids ?? []}
              onChange={(val) => setField("assignee_ids", val)}
              projectId={pid}
              multiple
              placeholder="Responsáveis"
            />
          </BulkFieldSlot>

          <BulkFieldSlot active={touched.has("label_ids")}>
            <IssuePropertyLabels
              projectId={pid ?? null}
              value={draft.label_ids ?? []}
              onChange={(val) => setField("label_ids", val ?? [])}
              renderByDefault
              hideDropdownArrow={false}
              noLabelBorder
              placeholderText="Tags"
              placement="bottom-start"
              buttonClassName={BULK_DROPDOWN_INNER_BUTTON_CLASS}
              className={BULK_DROPDOWN_SHELL_CLASS}
              fullHeight
            />
          </BulkFieldSlot>

          <BulkFieldSlot active={touched.has("start_date")}>
            <DateDropdown
              {...BULK_DROPDOWN_SHARED_PROPS}
              value={draft.start_date ?? null}
              onChange={(val) => setField("start_date", val ? renderFormattedPayloadDate(val) : null)}
              placeholder="Início"
            />
          </BulkFieldSlot>

          <BulkFieldSlot active={touched.has("target_date")}>
            <DateDropdown
              {...BULK_DROPDOWN_SHARED_PROPS}
              value={draft.target_date ?? null}
              onChange={(val) => setField("target_date", val ? renderFormattedPayloadDate(val) : null)}
              placeholder="Entrega"
            />
          </BulkFieldSlot>

          {currentProjectDetails?.cycle_view && (
            <BulkFieldSlot active={touched.has("cycle_id")}>
              <CycleDropdown
                {...BULK_DROPDOWN_SHARED_PROPS}
                value={draft.cycle_id ?? null}
                onChange={(val) => setField("cycle_id", val)}
                projectId={pid}
                placeholder="Ciclo"
                canRemoveCycle
              />
            </BulkFieldSlot>
          )}

          {currentProjectDetails?.module_view && (
            <BulkFieldSlot active={touched.has("module_ids")}>
              <ModuleDropdown
                {...BULK_DROPDOWN_SHARED_PROPS}
                value={draft.module_ids ?? []}
                onChange={(val) => setField("module_ids", val)}
                projectId={pid}
                multiple
                placeholder="Módulos"
              />
            </BulkFieldSlot>
          )}

          <BulkFieldSlot active={touched.has("estimate_point")}>
            <EstimateDropdown
              {...BULK_DROPDOWN_SHARED_PROPS}
              value={draft.estimate_point ?? null}
              onChange={(val) => setField("estimate_point", val ?? null)}
              projectId={pid}
              placeholder="Estimativa"
            />
          </BulkFieldSlot>
        </div>

        <ProjectHubToolbarDivider />

        <div className={cn(PROJECT_HUB_TOOLBAR_SEGMENT, "shrink-0 gap-1")}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleArchive}
            loading={isSubmitting}
            disabled={isSubmitting}
            className={cn(BULK_ACTION_BUTTON_CLASS, "text-secondary")}
          >
            <ArchiveIcon className="size-3.5" />
            <span className="hidden md:inline">Arquivar</span>
          </Button>
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              loading={isSubmitting}
              disabled={isSubmitting}
              className={cn(
                BULK_ACTION_BUTTON_CLASS,
                "text-danger hover:border-danger/35 hover:bg-danger/10 hover:text-danger"
              )}
            >
              <TrashIcon className="size-3.5" />
              <span className="hidden md:inline">Excluir</span>
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handleUpdate}
            loading={isSubmitting}
            disabled={isSubmitting || !hasChanges}
            className={cn(
              "border-accent-primary/50 shadow-sm h-8 min-w-[6.5rem] rounded-md border-[0.5px] px-3 text-12 font-semibold",
              "ring-1 ring-white/10 ring-inset"
            )}
          >
            Atualizar
          </Button>
        </div>
      </div>
    </div>
  );
});
