import React from "react";
import { observer } from "mobx-react";
import { PlusIcon } from "@operoz/propel/icons";
import type { TIssueServiceType } from "@operoz/types";
import { mergeTriggerElementProps, resolveCustomButtonTrigger } from "@operoz/ui";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

type Props = {
  customButton?: React.ReactNode;
  disabled?: boolean;
  issueServiceType: TIssueServiceType;
};

export const IssueLinksActionButton = observer(function IssueLinksActionButton(props: Props) {
  const { customButton, disabled = false, issueServiceType } = props;
  const { toggleIssueLinkModal } = useIssueDetail(issueServiceType);

  const handleOnClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    toggleIssueLinkModal(true);
  };

  const fallback = <PlusIcon className="h-4 w-4" />;
  const resolved = customButton ? resolveCustomButtonTrigger(customButton) : null;

  if (resolved) {
    return React.cloneElement(
      resolved,
      mergeTriggerElementProps(resolved, {
        type: "button",
        disabled,
        onClick: handleOnClick,
      })
    );
  }

  return (
    <button type="button" onClick={handleOnClick} disabled={disabled}>
      {customButton ?? fallback}
    </button>
  );
});
