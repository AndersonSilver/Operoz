import { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Plus, Trash2 } from "lucide-react";
import useSWR from "swr";
import { useTranslation } from "@operoz/i18n";
import { setToast, TOAST_TYPE } from "@operoz/propel/toast";
import type {
  IProjectIssueTypeLite,
  IWorkflow,
  IWorkflowScheme,
  TWorkflowBackTransitionMode,
  TWorkflowBootstrapMode,
} from "@operoz/types";
import type { TProject } from "@operoz/types";
import { useBoardIssueType } from "@/hooks/store/use-board-issue-type";
import { AlertModalCore } from "@operoz/ui";
import { WorkflowSchemeIssueTypeSelect } from "./workflow-scheme-issue-type-select";

type SchemeEntryDraft = {
  issue_type: string | null;
  workflow: string;
};

type Props = {
  workspaceSlug: string;
  scheme: IWorkflowScheme;
  workflows: IWorkflow[];
  projects: TProject[];
  onSaveEntries: (data: { name: string; is_default: boolean; entries: SchemeEntryDraft[] }) => Promise<IWorkflowScheme>;
  onBootstrap: (data: {
    project_id: string;
    issue_type?: string | null;
    assign_project?: boolean;
    mode?: TWorkflowBootstrapMode;
    back_transition_mode?: TWorkflowBackTransitionMode;
  }) => Promise<void>;
  onAssignProjects: (projectIds: string[]) => Promise<string[] | void>;
  onDelete?: () => Promise<void>;
};

function entriesFromScheme(scheme: IWorkflowScheme): SchemeEntryDraft[] {
  return (scheme.entries ?? []).map((entry) => ({
    issue_type: entry.issue_type,
    workflow: entry.workflow,
  }));
}

function assignedProjectIds(projects: TProject[], schemeId: string): string[] {
  return projects.filter((project) => project.workflow_scheme === schemeId).map((project) => project.id);
}

export const WorkflowSchemeEditor = observer(function WorkflowSchemeEditor(props: Props) {
  const { workspaceSlug, scheme, workflows, projects, onSaveEntries, onBootstrap, onAssignProjects, onDelete } = props;
  const { t } = useTranslation();
  const { fetchProjectIssueTypes, getProjectIssueTypes } = useBoardIssueType();

  const [name, setName] = useState(scheme.name);
  const [isDefault, setIsDefault] = useState(scheme.is_default);
  const [entries, setEntries] = useState<SchemeEntryDraft[]>(() => entriesFromScheme(scheme));
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(() => assignedProjectIds(projects, scheme.id));
  const [bootstrapProjectId, setBootstrapProjectId] = useState("");
  const [bootstrapIssueType, setBootstrapIssueType] = useState<string | null>(null);
  const [bootstrapMode, setBootstrapMode] = useState<TWorkflowBootstrapMode>("linear");
  const [bootstrapBackMode, setBootstrapBackMode] = useState<TWorkflowBackTransitionMode>("none");
  const [bootstrapAssign, setBootstrapAssign] = useState(true);
  const [isSavingEntries, setIsSavingEntries] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isSavingProjects, setIsSavingProjects] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setName(scheme.name);
    setIsDefault(scheme.is_default);
    setEntries(entriesFromScheme(scheme));
  }, [scheme]);

  useEffect(() => {
    setSelectedProjectIds(assignedProjectIds(projects, scheme.id));
  }, [projects, scheme.id]);

  const workflowOptions = useMemo(
    () => workflows.map((workflow) => ({ id: workflow.id, label: workflow.name })),
    [workflows]
  );

  const issueTypesCacheKey =
    workspaceSlug && projects.length > 0
      ? `WORKFLOW_SCHEME_ISSUE_TYPES_${workspaceSlug}_${projects.map((p) => p.id).join("_")}`
      : null;

  useSWR(issueTypesCacheKey, async () => {
    await Promise.all(projects.map((project) => fetchProjectIssueTypes(workspaceSlug, project.id)));
  });

  const issueTypes = useMemo(() => {
    const byId = new Map<string, IProjectIssueTypeLite>();
    for (const project of projects) {
      for (const issueType of getProjectIssueTypes(project.id)) {
        byId.set(issueType.id, issueType);
      }
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [projects, getProjectIssueTypes]);

  const bootstrapIssueTypes = bootstrapProjectId ? getProjectIssueTypes(bootstrapProjectId) : issueTypes;

  useEffect(() => {
    setBootstrapIssueType(null);
  }, [bootstrapProjectId]);

  const handleAddEntry = () => {
    const fallbackWorkflow = workflows[0]?.id ?? "";
    setEntries((current) => [...current, { issue_type: null, workflow: fallbackWorkflow }]);
  };

  const handleRemoveEntry = (index: number) => {
    setEntries((current) => current.filter((_, i) => i !== index));
  };

  const handleEntryChange = (index: number, patch: Partial<SchemeEntryDraft>) => {
    setEntries((current) => current.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  };

  const handleSaveEntries = useCallback(async () => {
    setIsSavingEntries(true);
    try {
      await onSaveEntries({
        name: name.trim() || scheme.name,
        is_default: isDefault,
        entries: entries.filter((entry) => entry.workflow),
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workspace_settings.settings.workflow.schemes.editor.saved"),
      });
    } finally {
      setIsSavingEntries(false);
    }
  }, [entries, isDefault, name, onSaveEntries, scheme.name, t]);

  const handleBootstrap = useCallback(async () => {
    if (!bootstrapProjectId) return;
    setIsBootstrapping(true);
    try {
      await onBootstrap({
        project_id: bootstrapProjectId,
        issue_type: bootstrapIssueType,
        assign_project: bootstrapAssign,
        mode: bootstrapMode,
        back_transition_mode: bootstrapMode === "linear" ? bootstrapBackMode : "none",
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workspace_settings.settings.workflow.schemes.editor.bootstrap_success"),
      });
    } finally {
      setIsBootstrapping(false);
    }
  }, [bootstrapAssign, bootstrapBackMode, bootstrapIssueType, bootstrapMode, bootstrapProjectId, onBootstrap, t]);

  const handleSaveProjects = useCallback(async () => {
    setIsSavingProjects(true);
    try {
      await onAssignProjects(selectedProjectIds);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workspace_settings.settings.workflow.schemes.editor.saved"),
      });
    } finally {
      setIsSavingProjects(false);
    }
  }, [onAssignProjects, selectedProjectIds, t]);

  const toggleProject = (projectId: string) => {
    setSelectedProjectIds((current) =>
      current.includes(projectId) ? current.filter((id) => id !== projectId) : [...current, projectId]
    );
  };

  const handleDeleteScheme = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.workflow.schemes.delete_failed"),
      });
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      {onDelete && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setIsDeleteOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-sm border border-subtle px-3 py-2 text-13 text-danger-primary hover:bg-danger-subtle/30"
          >
            <Trash2 className="size-4" strokeWidth={1.75} />
            {t("workspace_settings.settings.workflow.schemes.delete_scheme")}
          </button>
        </div>
      )}
      <section className="flex flex-col gap-4 rounded-md border border-subtle bg-layer-1 p-4">
        <div className="flex flex-col gap-2">
          <label className="text-11 font-medium text-tertiary" htmlFor="scheme-name">
            {t("workspace_settings.settings.workflow.schemes.editor.name_label")}
          </label>
          <input
            id="scheme-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-sm border border-subtle bg-surface-1 px-3 py-2 text-13 text-primary placeholder:text-tertiary"
          />
        </div>
        <label className="flex items-center gap-2 text-13 text-secondary">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(event) => setIsDefault(event.target.checked)}
            className="rounded-sm"
          />
          {t("workspace_settings.settings.workflow.schemes.editor.default_label")}
        </label>
      </section>

      <section className="flex flex-col gap-4 rounded-md border border-subtle bg-layer-1 p-4">
        <div>
          <h3 className="text-13 font-medium text-primary">
            {t("workspace_settings.settings.workflow.schemes.editor.entries_title")}
          </h3>
          <p className="mt-1 text-12 text-secondary">
            {t("workspace_settings.settings.workflow.schemes.editor.entries_hint")}
          </p>
        </div>

        {workflows.length === 0 ? (
          <p className="text-12 text-tertiary">
            {t("workspace_settings.settings.workflow.schemes.editor.no_workflows")}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((entry, index) => (
              <div
                key={`${entry.workflow}-${entry.issue_type ?? "all"}-${index}`}
                className="grid gap-2 rounded-sm border border-subtle bg-surface-1 p-3 md:grid-cols-[1fr_1fr_auto]"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-11 text-tertiary">
                    {t("workspace_settings.settings.workflow.schemes.editor.issue_type_label")}
                  </span>
                  <WorkflowSchemeIssueTypeSelect
                    value={entry.issue_type}
                    issueTypes={issueTypes}
                    onChange={(issueTypeId) => handleEntryChange(index, { issue_type: issueTypeId })}
                    disabled={issueTypes.length === 0}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-11 text-tertiary">
                    {t("workspace_settings.settings.workflow.schemes.editor.workflow_label")}
                  </span>
                  <select
                    value={entry.workflow}
                    onChange={(event) => handleEntryChange(index, { workflow: event.target.value })}
                    className="rounded-sm border border-subtle bg-layer-1 px-2 py-1.5 text-12 text-primary"
                  >
                    <option value="">{t("workspace_settings.settings.workflow.schemes.editor.select_workflow")}</option>
                    {workflowOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveEntry(index)}
                  className="self-end rounded-sm p-2 text-tertiary hover:bg-layer-transparent-hover hover:text-danger-primary md:self-center"
                  aria-label="Remove mapping"
                >
                  <Trash2 className="size-4" strokeWidth={1.75} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleAddEntry}
            disabled={workflows.length === 0}
            className="inline-flex items-center gap-1.5 rounded-sm border border-subtle px-3 py-2 text-13 text-secondary hover:bg-layer-transparent-hover disabled:opacity-50"
          >
            <Plus className="size-4" strokeWidth={1.75} />
            {t("workspace_settings.settings.workflow.schemes.editor.add_entry")}
          </button>
          <button
            type="button"
            onClick={handleSaveEntries}
            disabled={isSavingEntries || workflows.length === 0}
            className="text-on-color-primary rounded-sm bg-accent-primary px-3 py-2 text-13 font-medium hover:opacity-90 disabled:opacity-60"
          >
            {isSavingEntries
              ? t("workspace_settings.settings.workflow.schemes.editor.saving")
              : t("workspace_settings.settings.workflow.schemes.editor.save_entries")}
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-md border border-subtle bg-layer-1 p-4">
        <div>
          <h3 className="text-13 font-medium text-primary">
            {t("workspace_settings.settings.workflow.schemes.editor.bootstrap_title")}
          </h3>
          <p className="mt-1 text-12 text-secondary">
            {t("workspace_settings.settings.workflow.schemes.editor.bootstrap_hint")}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="text-11 text-tertiary">
              {t("workspace_settings.settings.workflow.schemes.editor.project_label")}
            </span>
            <select
              value={bootstrapProjectId}
              onChange={(event) => setBootstrapProjectId(event.target.value)}
              className="rounded-sm border border-subtle bg-surface-1 px-2 py-2 text-13 text-primary"
            >
              <option value="">{t("workspace_settings.settings.workflow.schemes.editor.project_placeholder")}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-11 text-tertiary">
              {t("workspace_settings.settings.workflow.schemes.editor.bootstrap_issue_type_label")}
            </span>
            <WorkflowSchemeIssueTypeSelect
              value={bootstrapIssueType}
              issueTypes={bootstrapIssueTypes}
              onChange={setBootstrapIssueType}
              disabled={!bootstrapProjectId || bootstrapIssueTypes.length === 0}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-11 text-tertiary">
              {t("workspace_settings.settings.workflow.schemes.editor.bootstrap_mode_label")}
            </span>
            <select
              value={bootstrapMode}
              onChange={(event) => {
                const nextMode = event.target.value as TWorkflowBootstrapMode;
                setBootstrapMode(nextMode);
                if (nextMode === "open") {
                  setBootstrapBackMode("none");
                }
              }}
              className="rounded-sm border border-subtle bg-surface-1 px-2 py-2 text-13 text-primary"
            >
              <option value="linear">
                {t("workspace_settings.settings.workflow.schemes.editor.bootstrap_mode_linear")}
              </option>
              <option value="open">
                {t("workspace_settings.settings.workflow.schemes.editor.bootstrap_mode_open")}
              </option>
            </select>
            <p className="text-11 text-tertiary">
              {bootstrapMode === "linear"
                ? t("workspace_settings.settings.workflow.schemes.editor.bootstrap_mode_linear_hint")
                : t("workspace_settings.settings.workflow.schemes.editor.bootstrap_mode_open_hint")}
            </p>
          </div>
          {bootstrapMode === "linear" && (
            <div className="flex flex-col gap-1 md:col-span-2">
              <span className="text-11 text-tertiary">
                {t("workspace_settings.settings.workflow.schemes.editor.bootstrap_back_mode_label")}
              </span>
              <select
                value={bootstrapBackMode}
                onChange={(event) => setBootstrapBackMode(event.target.value as TWorkflowBackTransitionMode)}
                className="rounded-sm border border-subtle bg-surface-1 px-2 py-2 text-13 text-primary"
              >
                <option value="none">
                  {t("workspace_settings.settings.workflow.schemes.editor.bootstrap_back_none")}
                </option>
                <option value="last_only">
                  {t("workspace_settings.settings.workflow.schemes.editor.bootstrap_back_last_only")}
                </option>
                <option value="adjacent">
                  {t("workspace_settings.settings.workflow.schemes.editor.bootstrap_back_adjacent")}
                </option>
              </select>
              <p className="text-11 text-tertiary">
                {bootstrapBackMode === "none"
                  ? t("workspace_settings.settings.workflow.schemes.editor.bootstrap_back_none_hint")
                  : bootstrapBackMode === "last_only"
                    ? t("workspace_settings.settings.workflow.schemes.editor.bootstrap_back_last_only_hint")
                    : t("workspace_settings.settings.workflow.schemes.editor.bootstrap_back_adjacent_hint")}
              </p>
            </div>
          )}
          <label className="flex items-end gap-2 pb-2 text-13 text-secondary md:col-span-2">
            <input
              type="checkbox"
              checked={bootstrapAssign}
              onChange={(event) => setBootstrapAssign(event.target.checked)}
              className="rounded-sm"
            />
            {t("workspace_settings.settings.workflow.schemes.editor.assign_project_label")}
          </label>
        </div>
        <button
          type="button"
          onClick={handleBootstrap}
          disabled={!bootstrapProjectId || isBootstrapping}
          className="w-fit rounded-sm border border-accent-strong px-3 py-2 text-13 font-medium text-accent-primary hover:bg-accent-primary/5 disabled:opacity-50"
        >
          {isBootstrapping
            ? t("workspace_settings.settings.workflow.schemes.editor.bootstrapping")
            : t("workspace_settings.settings.workflow.schemes.editor.bootstrap_action")}
        </button>
      </section>

      <section className="flex flex-col gap-4 rounded-md border border-subtle bg-layer-1 p-4">
        <div>
          <h3 className="text-13 font-medium text-primary">
            {t("workspace_settings.settings.workflow.schemes.editor.projects_title")}
          </h3>
          <p className="mt-1 text-12 text-secondary">
            {t("workspace_settings.settings.workflow.schemes.editor.projects_hint")}
          </p>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {projects.map((project) => (
            <label
              key={project.id}
              className="flex cursor-pointer items-center gap-2 rounded-sm border border-subtle bg-surface-1 px-3 py-2 text-13 text-primary hover:bg-layer-transparent-hover"
            >
              <input
                type="checkbox"
                checked={selectedProjectIds.includes(project.id)}
                onChange={() => toggleProject(project.id)}
                className="rounded-sm"
              />
              {project.name}
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={handleSaveProjects}
          disabled={isSavingProjects}
          className="text-on-color-primary w-fit rounded-sm bg-accent-primary px-3 py-2 text-13 font-medium hover:opacity-90 disabled:opacity-60"
        >
          {isSavingProjects
            ? t("workspace_settings.settings.workflow.schemes.editor.saving")
            : t("workspace_settings.settings.workflow.schemes.editor.save_projects")}
        </button>
      </section>

      <AlertModalCore
        isOpen={isDeleteOpen}
        handleClose={() => setIsDeleteOpen(false)}
        handleSubmit={handleDeleteScheme}
        title={t("workspace_settings.settings.workflow.schemes.delete_confirm_title")}
        content={t("workspace_settings.settings.workflow.schemes.delete_confirm_message", { name: scheme.name })}
        primaryButtonText={{
          default: t("workspace_settings.settings.workflow.schemes.delete_confirm_action"),
          loading: t("workspace_settings.settings.workflow.schemes.deleting"),
        }}
        secondaryButtonText={t("common.cancel")}
        isSubmitting={isDeleting}
        variant="danger"
      />
    </div>
  );
});
