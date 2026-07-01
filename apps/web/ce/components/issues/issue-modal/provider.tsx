import React, { useCallback, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
import type { ISearchIssueResponse, TIssue } from "@operoz/types";
import type { IIssueCustomFieldValuePayload } from "@operoz/types";
import { IssueModalContext } from "@/components/issues/issue-modal/context";
import { useBoardCustomField } from "@/hooks/store/use-board-custom-field";
import { useBoardIssueType } from "@/hooks/store/use-board-issue-type";
import { useUser } from "@/hooks/store/user/user-user";
import { BoardCustomFieldService } from "@/services/board/board-custom-field.service";
import type { TIssuePropertyValues } from "@/plane-web/types/issue-types";

export type TIssueModalProviderProps = {
  templateId?: string;
  dataForPreload?: Partial<TIssue>;
  allowedProjectIds?: string[];
  children: React.ReactNode;
};

const customFieldService = new BoardCustomFieldService();

export const IssueModalProvider = observer(function IssueModalProvider(props: TIssueModalProviderProps) {
  const { children, allowedProjectIds } = props;
  const { workspaceSlug } = useParams();
  const [selectedParentIssue, setSelectedParentIssue] = useState<ISearchIssueResponse | null>(null);
  const [issuePropertyValues, setIssuePropertyValues] = useState<TIssuePropertyValues>({});
  const [issuePropertyValueErrors, setIssuePropertyValueErrors] = useState<Record<string, string>>({});
  const { projectsWithCreatePermissions } = useUser();
  const { fetchProjectIssueTypes, getProjectIssueTypes } = useBoardIssueType();
  const { fetchProjectCustomFields, getProjectCustomFields } = useBoardCustomField();
  const projectIdsWithCreatePermissions = Object.keys(projectsWithCreatePermissions ?? {});

  const getActiveAdditionalPropertiesLength = useCallback(
    ({ projectId }: { projectId: string | null; workspaceSlug?: string }) => {
      if (!projectId) return 0;
      return getProjectCustomFields(projectId).length;
    },
    [getProjectCustomFields]
  );

  const handlePropertyValuesValidation = useCallback(() => true, []);

  const handleCreateUpdatePropertyValues = useCallback(
    async ({
      issueId,
      projectId,
      workspaceSlug: ws,
    }: {
      issueId: string;
      projectId: string;
      workspaceSlug: string;
    }) => {
      const fieldIds = new Set(getProjectCustomFields(projectId).map((f) => f.id));
      const values: IIssueCustomFieldValuePayload[] = Object.entries(issuePropertyValues)
        .filter(([fieldId]) => fieldIds.has(fieldId))
        .map(([custom_field_id, value]) => ({ custom_field_id, value }));

      if (values.length === 0) return;
      await customFieldService.saveIssueCustomFieldValues(ws, issueId, values);
    },
    [getProjectCustomFields, issuePropertyValues]
  );

  const handleProjectEntitiesFetch = useCallback(
    async ({ workItemProjectId }: { workItemProjectId: string | null | undefined }) => {
      if (!workspaceSlug || !workItemProjectId) return;
      await fetchProjectCustomFields(workspaceSlug.toString(), workItemProjectId);
    },
    [workspaceSlug, fetchProjectCustomFields]
  );

  return (
    <IssueModalContext.Provider
      value={{
        allowedProjectIds: allowedProjectIds ?? projectIdsWithCreatePermissions,
        workItemTemplateId: null,
        setWorkItemTemplateId: () => {},
        isApplyingTemplate: false,
        setIsApplyingTemplate: () => {},
        selectedParentIssue,
        setSelectedParentIssue,
        issuePropertyValues,
        setIssuePropertyValues,
        issuePropertyValueErrors,
        setIssuePropertyValueErrors,
        getIssueTypeIdOnProjectChange: (projectId: string) => {
          if (workspaceSlug) {
            void fetchProjectIssueTypes(workspaceSlug.toString(), projectId);
            void fetchProjectCustomFields(workspaceSlug.toString(), projectId);
          }
          const types = getProjectIssueTypes(projectId);
          if (types.length === 0) return null;
          return types.find((type) => type.is_default)?.id ?? types[0]?.id ?? null;
        },
        getActiveAdditionalPropertiesLength,
        handlePropertyValuesValidation,
        handleCreateUpdatePropertyValues,
        handleProjectEntitiesFetch,
        handleTemplateChange: () => Promise.resolve(),
        handleConvert: () => Promise.resolve(),
        handleCreateSubWorkItem: () => Promise.resolve(),
      }}
    >
      {children}
    </IssueModalContext.Provider>
  );
});
