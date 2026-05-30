import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import type { IProject } from "@operis/types";
import type { TCustomFieldValue } from "@operis/types";
import { useBoardCustomField } from "@/hooks/store/use-board-custom-field";
import { BoardCustomFieldService } from "@/services/board/board-custom-field.service";
import { BoardProjectDynamicFields } from "./board-project-dynamic-fields";

export type TProjectLayoutHandlers = {
  save: () => Promise<void>;
  getCustomFieldValues: () => Record<string, TCustomFieldValue>;
};

type Props = {
  workspaceSlug: string;
  project: IProject;
  isAdmin: boolean;
  onHandlersReady: (handlers: TProjectLayoutHandlers | null) => void;
};

export const ProjectBoardLayoutSection = observer(function ProjectBoardLayoutSection(props: Props) {
  const { workspaceSlug, project, isAdmin, onHandlersReady } = props;
  const { fetchProjectFormLayout, getBoardCustomFields } = useBoardCustomField();
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, TCustomFieldValue>>({});
  const service = useMemo(() => new BoardCustomFieldService(), []);

  const { data: formLayoutData } = useSWR(
    workspaceSlug && project.id && project.board_id
      ? `PROJECT_FORM_LAYOUT_${workspaceSlug}_${project.id}`
      : null,
    () => fetchProjectFormLayout(workspaceSlug, project.id),
    { revalidateIfStale: false, revalidateOnFocus: false, shouldRetryOnError: false }
  );

  useEffect(() => {
    if (!formLayoutData?.custom_field_values) return;
    const next: Record<string, TCustomFieldValue> = {};
    for (const row of formLayoutData.custom_field_values) {
      next[row.custom_field_id] = row.value as TCustomFieldValue;
    }
    setCustomFieldValues(next);
  }, [formLayoutData?.custom_field_values]);

  useEffect(() => {
    const layout = formLayoutData?.layout;
    if (!project.board_id || !layout?.length) {
      onHandlersReady(null);
      return;
    }

    onHandlersReady({
      getCustomFieldValues: () => customFieldValues,
      save: async () => {
        const entries = Object.entries(customFieldValues);
        if (entries.length === 0) return;
        await service.saveProjectCustomFieldValues(
          workspaceSlug,
          project.id,
          entries.map(([custom_field_id, value]) => ({ custom_field_id, value }))
        );
      },
    });
  }, [
    customFieldValues,
    formLayoutData?.layout,
    onHandlersReady,
    project.board_id,
    project.id,
    service,
    workspaceSlug,
  ]);

  if (!project.board_id || !formLayoutData?.layout?.length) return null;

  const boardSlug = formLayoutData.board_slug;
  const boardCustomFieldsLite = boardSlug
    ? getBoardCustomFields(workspaceSlug, boardSlug)
        .filter((f) => f.custom_field_id)
        .map((f) => ({
          id: f.custom_field_id!,
          name: f.name,
          key: f.key,
          description: f.description,
          field_type: f.field_type,
          settings: f.settings,
        }))
    : [];

  return (
    <div className="pt-2">
      <BoardProjectDynamicFields
        layout={formLayoutData.layout}
        workspaceSlug={workspaceSlug}
        mode="edit"
        projectId={project.id}
        disabled={!isAdmin}
        customFieldValues={customFieldValues}
        onCustomFieldChange={(id, val) => setCustomFieldValues((prev) => ({ ...prev, [id]: val }))}
        projectCustomFields={boardCustomFieldsLite}
      />
    </div>
  );
});
