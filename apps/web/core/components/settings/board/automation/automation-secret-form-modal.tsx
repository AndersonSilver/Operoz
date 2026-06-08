import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import type { IBoardAutomationSecret } from "@operis/types";
import { EModalPosition, EModalWidth, ModalCore } from "@operis/ui";
import { ConfigField, ConfigTextArea, ConfigTextInput } from "./automation-config-primitives";
import { secretRefSyntax } from "./automation-ops-utils";

export type SecretFormValues = {
  key: string;
  value: string;
  description: string;
};

type Props = {
  isOpen: boolean;
  mode: "create" | "edit";
  secret: IBoardAutomationSecret | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: SecretFormValues) => void;
};

export function AutomationSecretFormModal(props: Props) {
  const { isOpen, mode, secret, saving, onClose, onSubmit } = props;
  const { t } = useTranslation();
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    if (mode === "edit" && secret) {
      setKey(secret.key);
      setValue("");
      setDescription(secret.description ?? "");
      return;
    }
    setKey("");
    setValue("");
    setDescription("");
  }, [isOpen, mode, secret]);

  const canSubmit =
    mode === "create"
      ? key.trim().length > 0 && value.trim().length > 0
      : key.trim().length > 0;

  return (
    <ModalCore
      isOpen={isOpen}
      handleClose={onClose}
      position={EModalPosition.CENTER}
      width={EModalWidth.LG}
    >
      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-xl border border-subtle bg-accent-subtle text-accent-primary">
            <KeyRound className="size-4" strokeWidth={1.75} />
          </span>
          <div>
            <h3 className="text-15 font-semibold text-primary">
              {mode === "create"
                ? t("boards.settings.automation.ops.secrets.create_title")
                : t("boards.settings.automation.ops.secrets.edit_title")}
            </h3>
            <p className="mt-1 text-13 text-tertiary">
              {t("boards.settings.automation.ops.secrets.form_lead")}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-1">
          <ConfigField
            label={t("boards.settings.automation.ops.secrets.key_label")}
            hint={t("boards.settings.automation.ops.secrets.key_hint")}
          >
            <ConfigTextInput
              value={key}
              onChange={setKey}
              placeholder={t("boards.settings.automation.ops.secrets.key_placeholder")}
            />
          </ConfigField>

          {key.trim() && (
            <p className="mb-3 text-11 text-secondary">
              {t("boards.settings.automation.ops.secrets.ref_preview")}{" "}
              <code className="automation-ops-ref-chip">{secretRefSyntax(key.trim())}</code>
            </p>
          )}

          <ConfigField
            label={
              mode === "create"
                ? t("boards.settings.automation.ops.secrets.value_label")
                : t("boards.settings.automation.ops.secrets.value_edit_label")
            }
            hint={t("boards.settings.automation.ops.secrets.value_hint")}
          >
            <input
              type="password"
              autoComplete="new-password"
              className="w-full rounded border border-subtle bg-surface-2 px-2 py-1.5 text-13"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={
                mode === "edit"
                  ? t("boards.settings.automation.ops.secrets.value_edit_placeholder")
                  : undefined
              }
            />
          </ConfigField>

          <ConfigField label={t("boards.settings.automation.ops.secrets.description_label")}>
            <ConfigTextArea
              value={description}
              onChange={setDescription}
              placeholder={t("boards.settings.automation.ops.secrets.description_placeholder")}
              rows={3}
            />
          </ConfigField>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-subtle pt-4">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            {t("cancel")}
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={saving}
            disabled={!canSubmit}
            onClick={() =>
              onSubmit({
                key: key.trim(),
                value: value.trim(),
                description: description.trim(),
              })
            }
          >
            {mode === "create"
              ? t("boards.settings.automation.ops.secrets.create")
              : t("save_changes")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
