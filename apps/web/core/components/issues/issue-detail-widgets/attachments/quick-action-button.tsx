import React, { useCallback, useState } from "react";
import { observer } from "mobx-react";
import type { FileRejection } from "react-dropzone";
import { useDropzone } from "react-dropzone";
import { PlusIcon } from "@operoz/propel/icons";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { TIssueServiceType } from "@operoz/types";
import { mergeTriggerElementProps, resolveCustomButtonTrigger } from "@operoz/ui";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useFileSize } from "@/plane-web/hooks/use-file-size";
import { useAttachmentOperations } from "./helper";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  customButton?: React.ReactNode;
  disabled?: boolean;
  issueServiceType: TIssueServiceType;
};

export const IssueAttachmentActionButton = observer(function IssueAttachmentActionButton(props: Props) {
  const { workspaceSlug, projectId, issueId, customButton, disabled = false, issueServiceType } = props;
  const [isLoading, setIsLoading] = useState(false);
  const { setLastWidgetAction, fetchActivities } = useIssueDetail(issueServiceType);
  const { maxFileSize } = useFileSize();
  const { operations: attachmentOperations } = useAttachmentOperations(
    workspaceSlug,
    projectId,
    issueId,
    issueServiceType
  );

  const handleFetchPropertyActivities = useCallback(() => {
    fetchActivities(workspaceSlug, projectId, issueId);
  }, [fetchActivities, workspaceSlug, projectId, issueId]);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      const totalAttachedFiles = acceptedFiles.length + rejectedFiles.length;

      if (rejectedFiles.length === 0) {
        const currentFile: File = acceptedFiles[0];
        if (!currentFile || !workspaceSlug) return;

        setIsLoading(true);
        attachmentOperations
          .create(currentFile)
          .catch(() => {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Error!",
              message: "File could not be attached. Try uploading again.",
            });
          })
          .finally(() => {
            handleFetchPropertyActivities();
            setLastWidgetAction("attachments");
            setIsLoading(false);
          });
        return;
      }

      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message:
          totalAttachedFiles > 1
            ? "Only one file can be uploaded at a time."
            : `File must be of ${maxFileSize / 1024 / 1024}MB or less in size.`,
      });
    },
    [attachmentOperations, maxFileSize, workspaceSlug, handleFetchPropertyActivities, setLastWidgetAction]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxSize: maxFileSize,
    multiple: false,
    disabled: isLoading || disabled,
  });

  const fallback = <PlusIcon className="h-4 w-4" />;
  const resolved = customButton ? resolveCustomButtonTrigger(customButton) : null;
  const isDisabled = isLoading || disabled;

  if (resolved) {
    const { onClick, ...rootProps } = getRootProps();

    return (
      <>
        <input {...getInputProps()} />
        {React.cloneElement(
          resolved,
          mergeTriggerElementProps(resolved, {
            type: "button",
            disabled: isDisabled,
            ...rootProps,
            onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              onClick?.(event);
            },
          })
        )}
      </>
    );
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <button {...getRootProps()} type="button" disabled={isDisabled}>
        <input {...getInputProps()} />
        {customButton ?? fallback}
      </button>
    </div>
  );
});
