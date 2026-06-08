import { useRef, useState } from "react";
import { Loader2, Paperclip, Trash2, Upload } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { IntakeFormFileService } from "@operis/services";

export type TIntakePublicAttachmentItem = {
  asset_id: string;
  name: string;
};

type Props = {
  anchor: string;
  value: TIntakePublicAttachmentItem[];
  onChange: (value: TIntakePublicAttachmentItem[]) => void;
  disabled?: boolean;
};

const fileService = new IntakeFormFileService();

export function IntakePublicAttachmentField(props: Props) {
  const { anchor, value, onChange, disabled } = props;
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || disabled || uploading) return;
    setError(null);
    setUploading(true);
    const next = [...value];

    try {
      for (const file of Array.from(files)) {
        const response = await fileService.uploadAttachment(anchor, file);
        next.push({ asset_id: response.asset_id, name: file.name });
      }
      onChange(next);
    } catch {
      setError(t("intake_public_form.attachment_upload_error"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="intake-public-attachment">
      <button
        type="button"
        className="intake-public-attachment-drop"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="size-5 animate-spin text-accent-primary" />
        ) : (
          <Upload className="size-5 text-accent-primary" />
        )}
        <span className="text-13 font-medium text-primary">
          {uploading ? t("intake_public_form.attachment_uploading") : t("intake_public_form.attachment_drop")}
        </span>
        <span className="text-11 text-tertiary">{t("intake_public_form.attachment_hint")}</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        multiple
        disabled={disabled || uploading}
        onChange={(event) => void handleFiles(event.target.files)}
      />

      {value.length > 0 ? (
        <ul className="intake-public-attachment-list">
          {value.map((item) => (
            <li key={item.asset_id} className="intake-public-attachment-item">
              <Paperclip className="size-3.5 shrink-0 text-tertiary" />
              <span className="min-w-0 flex-1 truncate text-13 text-secondary">{item.name}</span>
              <button
                type="button"
                className="intake-public-attachment-remove"
                aria-label={t("intake_public_form.attachment_remove")}
                disabled={disabled || uploading}
                onClick={() => onChange(value.filter((entry) => entry.asset_id !== item.asset_id))}
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? <p className="intake-public-attachment-error">{error}</p> : null}
    </div>
  );
}
