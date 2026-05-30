/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { useTranslation } from "@plane/i18n";
import { MembersPropertyIcon } from "@plane/propel/icons";
import type { TIssue } from "@plane/types";
import { cn } from "@plane/utils";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { useUser } from "@/hooks/store/user";
import { IssueFormField, issueFormControlBaseClass } from "./issue-form-field";

type Props = {
  control: Control<TIssue>;
  projectId: string | null;
  handleFormChange: () => void;
  tabIndex?: number;
};

export const IssueModalAssigneeField = observer(function IssueModalAssigneeField(props: Props) {
  const { control, projectId, handleFormChange, tabIndex } = props;
  const { t } = useTranslation();
  const { data: currentUser } = useUser();
  const currentUserId = currentUser?.id;

  return (
    <Controller
      control={control}
      name="assignee_ids"
      render={({ field: { value, onChange } }) => {
        const assigneeIds = value ?? [];
        const isMeAssigned = currentUserId ? assigneeIds.includes(currentUserId) : false;

        const handleAssignToMe = () => {
          if (!currentUserId) return;
          if (isMeAssigned) {
            onChange(assigneeIds.filter((id) => id !== currentUserId));
          } else {
            onChange([...assigneeIds, currentUserId]);
          }
          handleFormChange();
        };

        return (
          <IssueFormField
            label={t("assignees")}
            controlWidth="full"
            labelAction={
              currentUserId ? (
                <button
                  type="button"
                  className="text-12 font-medium text-accent-primary hover:underline"
                  onClick={handleAssignToMe}
                >
                  {t("issue_modal_assign_to_me")}
                </button>
              ) : null
            }
          >
            <MemberDropdown
              projectId={projectId ?? undefined}
              value={assigneeIds}
              onChange={(ids) => {
                onChange(ids);
                handleFormChange();
              }}
              buttonVariant="border-with-text"
              multiple
              tabIndex={tabIndex}
              placeholder={t("issue_modal_assignee_automatic")}
              showUserDetails
              icon={MembersPropertyIcon}
              buttonClassName={cn(issueFormControlBaseClass, "w-full")}
              buttonContainerClassName="w-full"
              className="w-full"
            />
          </IssueFormField>
        );
      }}
    />
  );
});
