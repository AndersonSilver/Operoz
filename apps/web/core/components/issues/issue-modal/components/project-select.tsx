/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
// plane imports
import { ETabIndices } from "@plane/constants";
// types
import type { TIssue } from "@plane/types";
import { cn, getTabIndex } from "@plane/utils";
// components
import { ProjectDropdown } from "@/components/dropdowns/project/dropdown";
// hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
import { usePlatformOS } from "@/hooks/use-platform-os";
import {
  issueFormControlBaseClass,
  issueFormControlWidthClass,
  type IssueFormControlWidth,
} from "@/plane-web/components/issues/issue-modal/issue-form-field";

type TIssueProjectSelectProps = {
  control: Control<TIssue>;
  disabled?: boolean;
  handleFormChange: () => void;
  controlWidth?: IssueFormControlWidth;
};

export const IssueProjectSelect = observer(function IssueProjectSelect(props: TIssueProjectSelectProps) {
  const { control, disabled = false, handleFormChange, controlWidth = "medium" } = props;
  // store hooks
  const { isMobile } = usePlatformOS();
  // context hooks
  const { allowedProjectIds } = useIssueModal();

  const { getIndex } = getTabIndex(ETabIndices.ISSUE_FORM, isMobile);

  return (
    <Controller
      control={control}
      name="project_id"
      rules={{
        required: true,
      }}
      render={({ field: { value, onChange } }) => (
        <div className={cn(issueFormControlWidthClass[controlWidth])}>
          <ProjectDropdown
            value={value}
            onChange={(projectId) => {
              onChange(projectId);
              handleFormChange();
            }}
            multiple={false}
            buttonVariant="border-with-text"
            buttonClassName={cn(issueFormControlBaseClass, "w-full")}
            buttonContainerClassName="w-full"
            className="w-full"
            renderCondition={(projectId) => allowedProjectIds.includes(projectId)}
            tabIndex={getIndex("project_id")}
            disabled={disabled}
          />
        </div>
      )}
    />
  );
});
