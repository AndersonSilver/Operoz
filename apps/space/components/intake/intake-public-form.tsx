import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { CheckCircle2, FileText, Mail, Send, Shield } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import type { TIntakeFormField, TIntakeFormPublic } from "@operis/types";
import { Button } from "@operis/propel/button";
import { Input } from "@operis/ui";
import { cn } from "@operis/utils";
import {
  IntakePublicAttachmentField,
  type TIntakePublicAttachmentItem,
} from "./intake-public-attachment-field";
import { IntakePublicRichTextField } from "./intake-public-rich-text-field";
import "./intake-public-form.css";

type Props = {
  form: TIntakeFormPublic;
  anchor: string;
};

function FieldControl(props: {
  anchor: string;
  field: TIntakeFormField;
  value: unknown;
  onChange: (value: unknown) => void;
  priorityLabels: Record<string, string>;
  selectPlaceholder: string;
  submitting: boolean;
}) {
  const { anchor, field, value, onChange, priorityLabels, selectPlaceholder, submitting } = props;

  if (field.field_type === "description" || field.field_type === "paragraph") {
    return (
      <IntakePublicRichTextField
        fieldId={field.id}
        value={typeof value === "string" ? value : ""}
        onChange={(html) => onChange(html)}
      />
    );
  }

  if (field.field_type === "date") {
    return (
      <div className="intake-public-control">
        <Input
          type="date"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  if (field.field_type === "datetime") {
    return (
      <div className="intake-public-control">
        <Input
          type="datetime-local"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  if (field.field_type === "number") {
    return (
      <div className="intake-public-control">
        <Input
          type="number"
          value={typeof value === "number" || typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.help_text}
        />
      </div>
    );
  }

  if (field.field_type === "url") {
    return (
      <div className="intake-public-control">
        <Input
          type="url"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.help_text || "https://"}
        />
      </div>
    );
  }

  if (field.field_type === "select") {
    return (
      <select
        className="intake-public-select"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{selectPlaceholder}</option>
        {(field.options ?? []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (field.field_type === "labels") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="intake-public-labels">
        {(field.options ?? []).map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              className={cn("intake-public-label-chip", active && "is-active")}
              onClick={() =>
                onChange(active ? selected.filter((item) => item !== option) : [...selected, option])
              }
            >
              {option}
            </button>
          );
        })}
      </div>
    );
  }

  if (field.field_type === "checkbox") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="intake-public-checkbox-list">
        {(field.options ?? []).map((option) => (
          <label key={option} className="intake-public-checkbox-item">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={(e) =>
                onChange(
                  e.target.checked
                    ? [...selected, option]
                    : selected.filter((item) => item !== option)
                )
              }
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    );
  }

  if (field.field_type === "attachment") {
    const attachments = Array.isArray(value) ? (value as TIntakePublicAttachmentItem[]) : [];
    return (
      <IntakePublicAttachmentField
        anchor={anchor}
        value={attachments}
        disabled={submitting}
        onChange={(next) => onChange(next)}
      />
    );
  }

  if (field.field_type === "priority") {
    return (
      <select
        className="intake-public-select"
        value={typeof value === "string" ? value : "none"}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="none">{selectPlaceholder}</option>
        <option value="low">{priorityLabels.low}</option>
        <option value="medium">{priorityLabels.medium}</option>
        <option value="high">{priorityLabels.high}</option>
        <option value="urgent">{priorityLabels.urgent}</option>
      </select>
    );
  }

  return (
    <div className="intake-public-control">
      <Input
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.help_text}
      />
    </div>
  );
}

function PublicFormField(props: {
  anchor: string;
  field: TIntakeFormField;
  value: unknown;
  onChange: (value: unknown) => void;
  priorityLabels: Record<string, string>;
  selectPlaceholder: string;
  submitting: boolean;
}) {
  const { anchor, field, value, onChange, priorityLabels, selectPlaceholder, submitting } = props;
  const showHelpInline = field.help_text && field.field_type === "select";

  return (
    <div className="intake-public-field">
      <label className="intake-public-field-label" htmlFor={field.id}>
        <span>{field.label}</span>
        {field.required ? <span className="intake-public-field-required">*</span> : null}
      </label>
      {field.help_text && !showHelpInline ? (
        <p className="intake-public-field-hint">{field.help_text}</p>
      ) : null}
      <FieldControl
        anchor={anchor}
        field={field}
        value={value}
        onChange={onChange}
        priorityLabels={priorityLabels}
        selectPlaceholder={selectPlaceholder}
        submitting={submitting}
      />
    </div>
  );
}

export function IntakePublicForm(props: Props) {
  const { form, anchor } = props;
  const { t } = useTranslation();
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitterEmail, setSubmitterEmail] = useState("");

  const priorityLabels = useMemo(
    () => ({
      low: t("intake_public_form.priority_low"),
      medium: t("intake_public_form.priority_medium"),
      high: t("intake_public_form.priority_high"),
      urgent: t("intake_public_form.priority_urgent"),
    }),
    [t]
  );

  useEffect(() => {
    const initial: Record<string, unknown> = {};
    for (const field of form.fields) {
      if (field.field_type === "priority") initial[field.id] = "none";
      if (field.field_type === "attachment") initial[field.id] = [];
    }
    setValues(initial);
  }, [form.fields]);

  const sortedFields = useMemo(() => [...form.fields], [form.fields]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/public/intake-forms/${anchor}/submit/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fields: Object.fromEntries(
            Object.entries(values).map(([fieldId, fieldValue]) => {
              if (Array.isArray(fieldValue) && fieldValue.every((item) => typeof item === "object" && item && "asset_id" in item)) {
                return [fieldId, (fieldValue as TIntakePublicAttachmentItem[]).map((item) => item.asset_id)];
              }
              return [fieldId, fieldValue];
            })
          ),
          submitter_email: submitterEmail || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload?.error ?? t("intake_public_form.submit_error"));
        return;
      }
      setSubmitted(true);
    } catch {
      setError(t("intake_public_form.submit_error"));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="intake-public-shell">
        <div className="intake-public-success">
          <span className="intake-public-success-icon">
            <CheckCircle2 className="size-8" strokeWidth={1.75} />
          </span>
          <h1 className="intake-public-success-title">{t("intake_public_form.success_title")}</h1>
          <p className="intake-public-success-message">
            {form.submit_message || t("intake_public_form.success_fallback")}
          </p>
        </div>
        <p className="intake-public-branding">{t("intake_public_form.powered_by")}</p>
      </div>
    );
  }

  return (
    <div className="intake-public-shell">
      <div className="intake-public-card-stage">
        <div className="intake-public-card-frame" aria-hidden>
          <span className="intake-public-frame-corner intake-public-frame-corner-tl" />
          <span className="intake-public-frame-corner intake-public-frame-corner-tr" />
          <span className="intake-public-frame-corner intake-public-frame-corner-bl" />
          <span className="intake-public-frame-corner intake-public-frame-corner-br" />
        </div>
        <form onSubmit={(event) => void handleSubmit(event)} className="intake-public-card">
          <header className="intake-public-hero">
            <div className="intake-public-hero-accent" aria-hidden />
            <div className="intake-public-hero-top">
              <span className="intake-public-hero-icon">
                <FileText className="size-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="intake-public-brand">Operoz</p>
                <h1 className="intake-public-title">{form.header_title || form.name}</h1>
                {form.description ? <p className="intake-public-description">{form.description}</p> : null}
              </div>
            </div>
          </header>

          <div className="intake-public-body">
            <div className="intake-public-fields">
              {sortedFields.map((field) => (
                <PublicFormField
                  key={field.id}
                  anchor={anchor}
                  field={field}
                  value={values[field.id]}
                  onChange={(next) => setValues((current) => ({ ...current, [field.id]: next }))}
                  priorityLabels={priorityLabels}
                  selectPlaceholder={t("intake_public_form.select_placeholder")}
                  submitting={submitting}
                />
              ))}
            </div>

            <div className="intake-public-divider" />

            <div className="intake-public-contact">
              <label className="intake-public-contact-label" htmlFor="intake-submitter-email">
                <Mail className="size-4 text-tertiary" strokeWidth={1.75} />
                {t("intake_public_form.contact_email")}
              </label>
              <div className="intake-public-control">
                <Input
                  id="intake-submitter-email"
                  type="email"
                  value={submitterEmail}
                  onChange={(e) => setSubmitterEmail(e.target.value)}
                  placeholder={t("intake_public_form.contact_email_placeholder")}
                />
              </div>
              <p className="intake-public-contact-hint">{t("intake_public_form.contact_email_hint")}</p>
            </div>

            {error ? <p className="intake-public-error">{error}</p> : null}

            <div className="intake-public-footer">
              <p className="intake-public-footer-note">
                <Shield className="size-3.5 shrink-0" strokeWidth={1.75} />
                {t("intake_public_form.secure_note")}
              </p>
              <Button
                variant="primary"
                type="submit"
                loading={submitting}
                className="intake-public-submit"
              >
                <Send className="size-4" />
                {t("intake_public_form.submit")}
              </Button>
            </div>
          </div>
        </form>
      </div>

      <p className="intake-public-branding">{t("intake_public_form.powered_by")}</p>
    </div>
  );
}
