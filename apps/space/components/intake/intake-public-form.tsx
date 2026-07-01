import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { CheckCircle2, FileText, Mail, Send, Shield } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import type { TSupportCriticality, TIntakeFormField, TIntakeFormPublic } from "@operoz/types";
import { Button } from "@operoz/propel/button";
import { Input } from "@operoz/ui";
import { cn } from "@operoz/utils";
import { IntakePublicAttachmentField, type TIntakePublicAttachmentItem } from "./intake-public-attachment-field";
import { IntakePublicRichTextField } from "./intake-public-rich-text-field";
import "./intake-public-form.css";

type Props = {
  form: TIntakeFormPublic;
  anchor: string;
};

const SUPPORT_CRITICALITY_VALUES: TSupportCriticality[] = ["p0", "p1", "p2", "p3", "p4", "not_incident"];

const DEFAULT_SUPPORT_SLA_MINUTES: Record<TSupportCriticality, number> = {
  p0: 240,
  p1: 480,
  p2: 1440,
  p3: 4320,
  p4: 10080,
  not_incident: 10080,
};

function formatDateTimeLocal(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = `${date.getMonth() + 1}`.padStart(2, "0");
  const dd = `${date.getDate()}`.padStart(2, "0");
  const hh = `${date.getHours()}`.padStart(2, "0");
  const min = `${date.getMinutes()}`.padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function FieldControl(props: {
  anchor: string;
  field: TIntakeFormField;
  value: unknown;
  onChange: (value: unknown) => void;
  priorityLabels: Record<string, string>;
  selectPlaceholder: string;
  clientPlaceholder: string;
  criticalityLabels: Record<TSupportCriticality, string>;
  clients: TIntakeFormPublic["clients"];
  submitting: boolean;
}) {
  const {
    anchor,
    field,
    value,
    onChange,
    priorityLabels,
    selectPlaceholder,
    clientPlaceholder,
    criticalityLabels,
    clients,
    submitting,
  } = props;

  if (field.field_type === "client") {
    return (
      <select
        className="intake-public-select"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
      >
        <option value="">{clientPlaceholder}</option>
        {(clients ?? []).map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </select>
    );
  }

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
        <Input type="date" value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)} />
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

  if (field.field_type === "sla_due") {
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

  if (field.field_type === "criticality") {
    return (
      <select
        className="intake-public-select"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{selectPlaceholder}</option>
        {SUPPORT_CRITICALITY_VALUES.map((criticality) => (
          <option key={criticality} value={criticality}>
            {criticalityLabels[criticality]}
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
              onClick={() => onChange(active ? selected.filter((item) => item !== option) : [...selected, option])}
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
                onChange(e.target.checked ? [...selected, option] : selected.filter((item) => item !== option))
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

  if (field.field_type === "ticket_number") {
    return (
      <div className="intake-public-control">
        <Input
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.help_text || "INC-2026-0001"}
        />
      </div>
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
  clientPlaceholder: string;
  criticalityLabels: Record<TSupportCriticality, string>;
  clients: TIntakeFormPublic["clients"];
  submitting: boolean;
}) {
  const {
    anchor,
    field,
    value,
    onChange,
    priorityLabels,
    selectPlaceholder,
    clientPlaceholder,
    criticalityLabels,
    clients,
    submitting,
  } = props;
  const showHelpInline = field.help_text && field.field_type === "select";

  return (
    <div className="intake-public-field">
      <label className="intake-public-field-label" htmlFor={field.id}>
        <span>{field.label}</span>
        {field.required ? <span className="intake-public-field-required">*</span> : null}
      </label>
      {field.help_text && !showHelpInline ? <p className="intake-public-field-hint">{field.help_text}</p> : null}
      <FieldControl
        anchor={anchor}
        field={field}
        value={value}
        onChange={onChange}
        priorityLabels={priorityLabels}
        selectPlaceholder={selectPlaceholder}
        clientPlaceholder={clientPlaceholder}
        criticalityLabels={criticalityLabels}
        clients={clients}
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
  const [isSlaDueManuallyEdited, setIsSlaDueManuallyEdited] = useState(false);

  const priorityLabels = useMemo(
    () => ({
      low: t("intake_public_form.priority_low"),
      medium: t("intake_public_form.priority_medium"),
      high: t("intake_public_form.priority_high"),
      urgent: t("intake_public_form.priority_urgent"),
    }),
    [t]
  );

  const criticalityLabels = useMemo(
    () => ({
      p0: t("intake_public_form.criticality_p0"),
      p1: t("intake_public_form.criticality_p1"),
      p2: t("intake_public_form.criticality_p2"),
      p3: t("intake_public_form.criticality_p3"),
      p4: t("intake_public_form.criticality_p4"),
      not_incident: t("intake_public_form.criticality_not_incident"),
    }),
    [t]
  );

  const criticalityField = useMemo(
    () => form.fields.find((field) => field.field_type === "criticality"),
    [form.fields]
  );
  const slaDueField = useMemo(() => form.fields.find((field) => field.field_type === "sla_due"), [form.fields]);

  useEffect(() => {
    const initial: Record<string, unknown> = {};
    for (const field of form.fields) {
      if (field.field_type === "priority") initial[field.id] = "none";
      if (field.field_type === "attachment") initial[field.id] = [];
    }
    setValues(initial);
    setIsSlaDueManuallyEdited(false);
  }, [form.fields]);

  useEffect(() => {
    if (!criticalityField || !slaDueField || isSlaDueManuallyEdited) return;
    const selectedCriticality = values[criticalityField.id];
    if (typeof selectedCriticality !== "string" || selectedCriticality.length === 0) return;

    const key = selectedCriticality as TSupportCriticality;
    const durationMinutes = form.sla_policy?.[key]?.duration_minutes ?? DEFAULT_SUPPORT_SLA_MINUTES[key];
    if (!durationMinutes) return;

    const computedDate = new Date(Date.now() + durationMinutes * 60 * 1000);
    const computedLocal = formatDateTimeLocal(computedDate);
    setValues((current) =>
      current[slaDueField.id] === computedLocal ? current : { ...current, [slaDueField.id]: computedLocal }
    );
  }, [criticalityField, form.sla_policy, isSlaDueManuallyEdited, slaDueField, values]);

  const sortedFields = useMemo(() => [...form.fields], [form.fields]);
  const themeClass = form.theme ? `intake-theme-${form.theme}` : "intake-theme-default";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const clientField = form.fields.find((field) => field.field_type === "client");
    if (clientField?.required && !values[clientField.id]) {
      setError(t("intake_public_form.client_required"));
      return;
    }
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
              if (
                Array.isArray(fieldValue) &&
                fieldValue.every((item) => typeof item === "object" && item && "asset_id" in item)
              ) {
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
      <div className={cn("intake-public-shell", themeClass)}>
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
    <div className={cn("intake-public-shell", themeClass)}>
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
                  onChange={(next) => {
                    if (field.field_type === "sla_due") {
                      setIsSlaDueManuallyEdited(true);
                    }
                    if (field.field_type === "criticality") {
                      setIsSlaDueManuallyEdited(false);
                    }
                    setValues((current) => ({ ...current, [field.id]: next }));
                  }}
                  priorityLabels={priorityLabels}
                  criticalityLabels={criticalityLabels}
                  selectPlaceholder={t("intake_public_form.select_placeholder")}
                  clientPlaceholder={t("intake_public_form.client_placeholder")}
                  clients={form.clients}
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
              <Button variant="primary" type="submit" loading={submitting} className="intake-public-submit">
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
