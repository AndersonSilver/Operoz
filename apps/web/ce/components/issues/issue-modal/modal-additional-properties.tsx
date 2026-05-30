import { useEffect, useMemo } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { useTranslation } from "@operis/i18n";
import type { TCustomFieldValue } from "@operis/types";
import { cn } from "@operis/utils";
import { useIssueModal } from "@/hooks/context/use-issue-modal";
import { useBoard } from "@/hooks/store/use-board";
import { useBoardCustomField } from "@/hooks/store/use-board-custom-field";
import { useProject } from "@/hooks/store/use-project";
import { BoardCustomFieldService } from "@/services/board/board-custom-field.service";
import { BoardCustomFieldFormField } from "./board-custom-field-form-field";

export type TWorkItemModalAdditionalPropertiesProps = {
  isDraft?: boolean;
  projectId: string | null;
  workItemId: string | undefined;
  workspaceSlug: string;
  /** Campos na grelha do formulário (sem acordeão «Mais campos»). */
  layout?: "accordion" | "grid";
};

const service = new BoardCustomFieldService();

export const WorkItemModalAdditionalProperties = observer(function WorkItemModalAdditionalProperties(
  props: TWorkItemModalAdditionalPropertiesProps
) {
  const { projectId, workItemId, workspaceSlug, layout = "accordion" } = props;
  const { t } = useTranslation();
  const { issuePropertyValues, setIssuePropertyValues } = useIssueModal();
  const { fetchProjectCustomFields, getProjectCustomFields, getBoardCustomFields } = useBoardCustomField();
  const { getProjectById } = useProject();
  const { getBoardById } = useBoard();
  const project = projectId ? getProjectById(projectId) : undefined;
  const board = project?.board_id ? getBoardById(project.board_id) : undefined;

  const fields = projectId ? getProjectCustomFields(projectId) : [];

  const boardFieldsByCustomId = useMemo(() => {
    if (!board?.slug) return new Map<string, { sort_order: number; form_span?: string }>();
    const map = new Map<string, { sort_order: number; form_span?: string }>();
    getBoardCustomFields(workspaceSlug, board.slug)
      .filter((f) => f.is_enabled && f.custom_field_id)
      .forEach((f) => {
        map.set(f.custom_field_id!, { sort_order: f.sort_order, form_span: f.form_span });
      });
    return map;
  }, [board?.slug, getBoardCustomFields, workspaceSlug]);

  const sortedFields = useMemo(() => {
    const onBoard = board?.slug
      ? fields.filter((f) => boardFieldsByCustomId.has(f.id))
      : fields;
    return [...onBoard].sort((a, b) => {
      const orderA = boardFieldsByCustomId.get(a.id)?.sort_order ?? 0;
      const orderB = boardFieldsByCustomId.get(b.id)?.sort_order ?? 0;
      return orderA - orderB || a.name.localeCompare(b.name);
    });
  }, [fields, boardFieldsByCustomId, board?.slug]);

  useSWR(
    workspaceSlug && projectId ? `PROJECT_ISSUE_FORM_FIELDS_${workspaceSlug}_${projectId}` : null,
    () => fetchProjectCustomFields(workspaceSlug, projectId!),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    }
  );

  useEffect(() => {
    if (!workItemId) setIssuePropertyValues({});
  }, [projectId, workItemId, setIssuePropertyValues]);

  useEffect(() => {
    if (!workspaceSlug || !workItemId) return;
    void service.getIssueCustomFieldValues(workspaceSlug, workItemId).then((rows) => {
      const next: Record<string, TCustomFieldValue> = {};
      for (const row of rows) {
        const raw = row.value;
        if (typeof raw === "object" && raw !== null && "member_id" in (raw as object)) {
          next[row.custom_field_id] = raw as TCustomFieldValue;
        } else if (
          typeof raw === "string" ||
          typeof raw === "number" ||
          typeof raw === "boolean" ||
          raw === null ||
          Array.isArray(raw)
        ) {
          next[row.custom_field_id] = raw as TCustomFieldValue;
        } else if (typeof raw === "object" && raw !== null && "text" in (raw as object)) {
          next[row.custom_field_id] = (raw as { text: string }).text;
        }
      }
      setIssuePropertyValues((prev) => ({ ...prev, ...next }));
    });
  }, [workspaceSlug, workItemId, setIssuePropertyValues]);

  if (!projectId || fields.length === 0) return null;

  const setValue = (fieldId: string, value: TCustomFieldValue) => {
    setIssuePropertyValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  if (layout === "grid") {
    return (
      <>
        {sortedFields.map((field) => {
          const meta = boardFieldsByCustomId.get(field.id);
          const isFull = meta?.form_span === "full";
          return (
            <div
              key={field.id}
              className={cn(isFull && "sm:col-span-2")}
              style={board?.slug ? { order: meta?.sort_order ?? 0 } : undefined}
            >
              <BoardCustomFieldFormField
                field={field}
                value={issuePropertyValues[field.id]}
                projectId={projectId}
                onChange={(val) => setValue(field.id, val)}
              />
            </div>
          );
        })}
      </>
    );
  }

  return (
    <div className="border-t border-subtle pt-3 sm:col-span-2">
      <p className="pb-2 text-12 font-medium text-secondary">
        {t("boards.settings.fields.issue_form_section")} ({sortedFields.length})
      </p>
      <div className="space-y-3 pb-1">
        {sortedFields.map((field) => (
          <BoardCustomFieldFormField
            key={field.id}
            field={field}
            value={issuePropertyValues[field.id]}
            projectId={projectId}
            onChange={(val) => setValue(field.id, val)}
          />
        ))}
      </div>
    </div>
  );
});
