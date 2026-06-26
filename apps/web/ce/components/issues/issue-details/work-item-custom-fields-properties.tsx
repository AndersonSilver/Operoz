import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { useTranslation } from "@operis/i18n";
import { WorkItemsIcon } from "@operis/propel/icons";
import type { IProjectCustomFieldLite, TCustomFieldValue } from "@operis/types";
import { cn } from "@operis/utils";
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
import { useBoard } from "@/hooks/store/use-board";
import { useBoardCustomField } from "@/hooks/store/use-board-custom-field";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { BoardCustomFieldService } from "@/services/board/board-custom-field.service";
import { BoardCustomFieldFormField } from "@/plane-web/components/issues/issue-modal/board-custom-field-form-field";

const service = new BoardCustomFieldService();

function parseCustomFieldRows(rows: { custom_field_id: string; value: unknown }[]): Record<string, TCustomFieldValue> {
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
  return next;
}

function hasCustomFieldValue(value: TCustomFieldValue | undefined): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "boolean" || typeof value === "number") return true;
  if (typeof value === "object" && "member_id" in value) return Boolean(value.member_id);
  return false;
}

function formatCustomFieldDisplay(
  field: IProjectCustomFieldLite,
  value: TCustomFieldValue | undefined,
  getMemberName: (id: string) => string | undefined
): string {
  if (!hasCustomFieldValue(value)) return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (typeof value === "object" && value !== null && "member_id" in value) {
    const memberId = String((value as { member_id?: string }).member_id ?? "");
    return getMemberName(memberId) ?? memberId;
  }
  if (field.field_type === "url" && typeof value === "string") return value;
  return String(value);
}

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  isEditable: boolean;
  layout?: "sidebar" | "inbox";
};

export const WorkItemCustomFieldsProperties = observer(function WorkItemCustomFieldsProperties(props: Props) {
  const { workspaceSlug, projectId, issueId, isEditable, layout = "sidebar" } = props;
  const { t } = useTranslation();
  const { getProjectById } = useProject();
  const { getBoardById } = useBoard();
  const { getUserDetails } = useMember();
  const { fetchProjectCustomFields, getProjectCustomFields, getBoardCustomFields } = useBoardCustomField();
  const [values, setValues] = useState<Record<string, TCustomFieldValue>>({});

  const project = getProjectById(projectId);
  const board = project?.board_id ? getBoardById(project.board_id) : undefined;
  const fields = getProjectCustomFields(projectId);

  const boardFieldsByCustomId = useMemo(() => {
    if (!board?.slug) return new Map<string, { sort_order: number }>();
    const map = new Map<string, { sort_order: number }>();
    getBoardCustomFields(workspaceSlug, board.slug)
      .filter((f) => f.is_enabled && f.custom_field_id)
      .forEach((f) => {
        map.set(f.custom_field_id!, { sort_order: f.sort_order });
      });
    return map;
  }, [board?.slug, getBoardCustomFields, workspaceSlug]);

  const sortedFields = useMemo(() => {
    const onBoard = board?.slug ? fields.filter((f) => boardFieldsByCustomId.has(f.id)) : fields;
    return [...onBoard].sort((a, b) => {
      const orderA = boardFieldsByCustomId.get(a.id)?.sort_order ?? 0;
      const orderB = boardFieldsByCustomId.get(b.id)?.sort_order ?? 0;
      return orderA - orderB || a.name.localeCompare(b.name);
    });
  }, [fields, boardFieldsByCustomId, board?.slug]);

  const visibleFields = useMemo(
    () => sortedFields.filter((field) => hasCustomFieldValue(values[field.id])),
    [sortedFields, values]
  );

  useSWR(
    workspaceSlug && projectId ? `PROJECT_ISSUE_FORM_FIELDS_${workspaceSlug}_${projectId}` : null,
    () => fetchProjectCustomFields(workspaceSlug, projectId),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    }
  );

  useSWR(
    workspaceSlug && issueId ? `ISSUE_CUSTOM_FIELD_VALUES_${workspaceSlug}_${issueId}` : null,
    () => service.getIssueCustomFieldValues(workspaceSlug, issueId).then(parseCustomFieldRows),
    {
      onSuccess: (data) => setValues(data),
      revalidateOnFocus: false,
    }
  );

  const persistValue = async (fieldId: string, value: TCustomFieldValue) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    await service.saveIssueCustomFieldValues(workspaceSlug, issueId, [{ custom_field_id: fieldId, value }]);
  };

  const getMemberName = (memberId: string) => getUserDetails(memberId)?.display_name;

  if (visibleFields.length === 0) return null;

  if (layout === "inbox") {
    return (
      <div className={cn("mt-3 border-t-2 border-subtle-1 pt-3", !isEditable && "opacity-60")}>
        <h6 className="mb-2 text-12 font-medium text-secondary">{t("boards.settings.fields.issue_form_section")}</h6>
        <div className="flex flex-col gap-3">
          {visibleFields.map((field) => (
            <div key={field.id} className="flex min-h-8 items-start gap-2">
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 pt-1.5 text-13 text-tertiary">
                <WorkItemsIcon className="size-4 flex-shrink-0" />
                <span className="truncate">{field.name}</span>
              </div>
              <div className="w-3/5 min-w-0 flex-grow">
                {isEditable ? (
                  <BoardCustomFieldFormField
                    field={field}
                    value={values[field.id]}
                    projectId={projectId}
                    onChange={(val) => void persistValue(field.id, val)}
                  />
                ) : (
                  <p className="pt-1.5 text-13 break-words text-primary">
                    {formatCustomFieldDisplay(field, values[field.id], getMemberName)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {visibleFields.map((field) => (
        <SidebarPropertyListItem key={field.id} label={field.name}>
          {isEditable ? (
            <div className="w-full min-w-0 py-0.5">
              <BoardCustomFieldFormField
                field={field}
                value={values[field.id]}
                projectId={projectId}
                onChange={(val) => void persistValue(field.id, val)}
              />
            </div>
          ) : (
            <span className="text-body-xs-regular break-words text-primary">
              {formatCustomFieldDisplay(field, values[field.id], getMemberName)}
            </span>
          )}
        </SidebarPropertyListItem>
      ))}
    </>
  );
});
