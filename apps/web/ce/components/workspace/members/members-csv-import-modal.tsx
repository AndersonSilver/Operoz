import { useCallback, useState } from "react";
import { observer } from "mobx-react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { IWorkspaceBulkInviteFormData } from "@operoz/types";
import { EModalPosition, EModalWidth, ModalCore } from "@operoz/ui";
import {
  WORKSPACE_MEMBERS_CSV_TEMPLATE,
  csvDownload,
  parseWorkspaceMembersCsv,
  workspaceMembersCsvToInvitePayload,
  type TWorkspaceMemberCsvParseResult,
} from "@operoz/utils";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: IWorkspaceBulkInviteFormData) => Promise<void>;
};

export const MembersCsvImportModal = observer(function MembersCsvImportModal(props: Props) {
  const { isOpen, onClose, onSubmit } = props;
  const { t } = useTranslation();
  const [parseResult, setParseResult] = useState<TWorkspaceMemberCsvParseResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetState = () => {
    setParseResult(null);
    setFileName(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const content = typeof reader.result === "string" ? reader.result : "";
        setParseResult(parseWorkspaceMembersCsv(content));
        setFileName(file.name);
      };
      reader.onerror = () => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: t("workspace_settings.settings.members.csv_import.errors.read_failed"),
        });
      };
      reader.readAsText(file);
    },
    [t]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      handleFile(file);
    },
    [handleFile]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    multiple: false,
    maxFiles: 1,
  });

  const handleImport = async () => {
    if (!parseResult || parseResult.valid.length === 0) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("workspace_settings.settings.members.csv_import.errors.no_valid_rows"),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(workspaceMembersCsvToInvitePayload(parseResult.valid));
      handleClose();
    } catch {
      // Parent shows error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadTemplate = () => {
    csvDownload(WORKSPACE_MEMBERS_CSV_TEMPLATE, "workspace-members-template");
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XL}>
      <div className="flex flex-col gap-5 p-6">
        <div>
          <h3 className="text-16 font-semibold text-primary">
            {t("workspace_settings.settings.members.csv_import.title")}
          </h3>
          <p className="mt-1 text-13 text-tertiary">
            {t("workspace_settings.settings.members.csv_import.description")}
          </p>
        </div>

        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={downloadTemplate}>
            {t("workspace_settings.settings.members.csv_import.download_template")}
          </Button>
        </div>

        <div
          {...getRootProps()}
          className={`flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-4 py-6 text-center ${
            isDragActive ? "border-accent-strong bg-accent-primary/10" : "border-subtle bg-surface-1"
          }`}
        >
          <input {...getInputProps()} />
          <p className="text-13 text-secondary">
            {isDragActive
              ? t("workspace_settings.settings.members.csv_import.drop_here")
              : t("workspace_settings.settings.members.csv_import.dropzone")}
          </p>
          {fileName && <p className="mt-2 text-11 text-tertiary">{fileName}</p>}
        </div>

        {fileRejections.length > 0 && (
          <p className="text-13 text-danger-primary">
            {t("workspace_settings.settings.members.csv_import.errors.invalid_file")}
          </p>
        )}

        {parseResult && (
          <div className="space-y-3 rounded-md border border-subtle bg-surface-1 p-4">
            <p className="text-13 text-primary">
              {t("workspace_settings.settings.members.csv_import.summary", {
                valid: parseResult.valid.length,
                invalid: parseResult.invalid.length,
              })}
            </p>
            {parseResult.invalid.length > 0 && (
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {parseResult.invalid.slice(0, 10).map((row) => (
                  <p key={`${row.line}-${row.reason}`} className="text-11 text-danger-primary">
                    {t("workspace_settings.settings.members.csv_import.row_error", {
                      line: row.line,
                      reason: row.reason,
                    })}
                  </p>
                ))}
                {parseResult.invalid.length > 10 && (
                  <p className="text-11 text-tertiary">
                    {t("workspace_settings.settings.members.csv_import.more_errors", {
                      count: parseResult.invalid.length - 10,
                    })}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose}>
            {t("cancel")}
          </Button>
          <Button
            variant="primary"
            loading={isSubmitting}
            disabled={!parseResult || parseResult.valid.length === 0}
            onClick={handleImport}
          >
            {t("workspace_settings.settings.members.csv_import.import")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
