"use client";

import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Calendar, Copy, ExternalLink, RotateCcw } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { IconButton } from "@operis/propel/icon-button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { TSupportCriticality, TSupportTicketSubmissionField } from "@operis/types";
import { cn, copyTextToClipboard, getTextContent } from "@operis/utils";
import type { IInboxIssueStore } from "@/store/inbox/inbox-issue.store";

type Props = {
  inboxIssue: IInboxIssueStore;
};

type FieldKind = "description" | "link" | "path" | "date" | "short" | "skip";

type ClassifiedField = TSupportTicketSubmissionField & {
  kind: FieldKind;
  displayValue: string;
};

const PRIORITY_KEYS = new Set(["none", "low", "medium", "high", "urgent"]);
const HTTP_URL_PATTERN = /^https?:\/\//i;
const DATE_VALUE_PATTERN = /^\d{4}-\d{2}-\d{2}/;

const DESCRIPTION_LABELS = [
  "descrição",
  "descricao",
  "description",
  "detalhes",
  "paragraph",
  "observações",
  "observacoes",
  "comentário",
  "comentario",
  "notas",
];
const LINK_LABELS = [
  "link",
  "url",
  "tela",
  "login",
  "documentação",
  "documentacao",
  "referência",
  "referencia",
  "arquivo",
];
const DATE_LABELS = ["data", "date", "homologação", "homologacao", "prazo", "deadline"];
const SUMMARY_LABELS = ["resumo", "summary", "assunto", "subject", "título", "titulo", "title"];
const CRITICALITY_VALUES: TSupportCriticality[] = ["p0", "p1", "p2", "p3", "p4", "not_incident"];

const CRITICALITY_DOT: Record<TSupportCriticality, string> = {
  p0: "bg-danger-primary",
  p1: "bg-warning-primary",
  p2: "bg-[#f97316]",
  p3: "bg-accent-primary",
  p4: "bg-tertiary",
  not_incident: "bg-subtle-foreground/40",
};

const FIELD_INPUT_CLASS =
  "h-10 w-full rounded-lg border-0 bg-transparent px-0 text-13 text-primary shadow-none transition-colors placeholder:text-placeholder focus:border-0 focus:outline-none focus:ring-0";

const FIELD_SHELL_CLASS =
  "rounded-lg border border-subtle bg-surface-1 px-3 shadow-xs transition-colors focus-within:border-accent-strong focus-within:ring-2 focus-within:ring-accent-primary/15";

const PLACEHOLDER_SUMMARIES = new Set([
  "detalhes do chamado",
  "detalhes",
  "chamado de sustentacao",
  "chamado de sustentação",
  "support ticket",
]);

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase();
}

function normalizeSummary(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[«»"']/g, "");
}

function isPlaceholderSummary(value: string): boolean {
  return PLACEHOLDER_SUMMARIES.has(normalizeSummary(value));
}

function stripHtmlIfNeeded(value: string): string {
  if (value.includes("<") && value.includes(">")) {
    return getTextContent(value) || value;
  }
  return value;
}

function formatSubmissionValue(value: string, t: (key: string) => string): string {
  const plain = stripHtmlIfNeeded(value);
  const normalized = plain.trim().toLowerCase();
  if (normalized === "none") return t("common.none");
  if (PRIORITY_KEYS.has(normalized) && normalized !== "none") {
    return t(`issue.priority.${normalized}`);
  }
  return plain.trim();
}

function looksLikePath(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed.includes("/") || trimmed.includes(" ")) return false;
  if (HTTP_URL_PATTERN.test(trimmed)) return false;
  return /^[\w./\-_]+$/.test(trimmed) && trimmed.length > 8;
}

function classifyField(field: TSupportTicketSubmissionField, displayValue: string): FieldKind {
  const label = normalizeLabel(field.label);

  if (SUMMARY_LABELS.some((token) => label.includes(token)) && isPlaceholderSummary(displayValue)) {
    return "skip";
  }

  if (
    DESCRIPTION_LABELS.some((token) => label.includes(token)) ||
    displayValue.length > 140 ||
    displayValue.includes("\n")
  ) {
    return "description";
  }

  if (
    HTTP_URL_PATTERN.test(displayValue) ||
    LINK_LABELS.some((token) => label.includes(token)) ||
    looksLikePath(displayValue)
  ) {
    return HTTP_URL_PATTERN.test(displayValue) ? "link" : "path";
  }

  if (DATE_LABELS.some((token) => label.includes(token)) || DATE_VALUE_PATTERN.test(displayValue)) {
    return "date";
  }

  if (SUMMARY_LABELS.some((token) => label.includes(token)) && displayValue.length <= 100) {
    return "short";
  }

  return "short";
}

function truncatePath(value: string, max = 48): string {
  if (value.length <= max) return value;
  return `${value.slice(0, 20)}…${value.slice(-22)}`;
}

function toDateTimeLocal(value?: string | null): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const yyyy = parsed.getFullYear();
  const mm = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const dd = `${parsed.getDate()}`.padStart(2, "0");
  const hh = `${parsed.getHours()}`.padStart(2, "0");
  const min = `${parsed.getMinutes()}`.padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function toIsoOrEmpty(value: string): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString();
}

function CopyPathButton({ value }: { value: string }) {
  const { t } = useTranslation();

  return (
    <IconButton
      size="sm"
      variant="ghost"
      onClick={async () => {
        await copyTextToClipboard(value);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("common.success"),
          message: t("inbox_issue.support_form.copied"),
        });
      }}
      aria-label={t("inbox_issue.support_form.copy")}
      icon={Copy}
      className="shrink-0"
    />
  );
}

function DescriptionValue({ text }: { text: string }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 140;

  return (
    <div className="min-w-0">
      <p className={cn("text-13 leading-snug text-primary", !expanded && isLong && "line-clamp-2")}>{text}</p>
      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-1 text-11 font-medium text-accent-primary hover:underline"
        >
          {expanded ? t("inbox_issue.support_form.show_less") : t("inbox_issue.support_form.show_more")}
        </button>
      ) : null}
    </div>
  );
}

function FieldValue({ field }: { field: ClassifiedField }) {
  if (field.kind === "description") {
    return <DescriptionValue text={field.displayValue} />;
  }

  if (field.kind === "path") {
    return (
      <div className="flex min-w-0 items-center gap-1">
        <code className="font-mono min-w-0 truncate text-12 text-secondary" title={field.displayValue}>
          {truncatePath(field.displayValue)}
        </code>
        <CopyPathButton value={field.displayValue} />
      </div>
    );
  }

  if (field.kind === "link") {
    const href = field.displayValue.trim();
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex max-w-full items-center gap-1 text-13 text-accent-primary hover:underline"
      >
        <span className="truncate">{href}</span>
        <ExternalLink className="size-3 shrink-0 opacity-70" />
      </a>
    );
  }

  if (field.kind === "date") {
    return (
      <span className="inline-flex items-center gap-1.5 text-13 text-primary">
        <Calendar className="size-3.5 text-tertiary" />
        {field.displayValue}
      </span>
    );
  }

  return <span className="text-13 text-primary">{field.displayValue}</span>;
}

export const SupportTicketTriagePanel = observer(function SupportTicketTriagePanel({ inboxIssue }: Props) {
  const { t } = useTranslation();
  const [criticality, setCriticality] = useState<TSupportCriticality | "">("");
  const [slaDueAt, setSlaDueAt] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    setCriticality((inboxIssue.support_ticket?.criticality as TSupportCriticality | null) ?? "");
    setSlaDueAt(toDateTimeLocal(inboxIssue.support_ticket?.sla_due_at));
    setTicketNumber(inboxIssue.support_ticket?.ticket_number ?? "");
  }, [
    inboxIssue.support_ticket?.criticality,
    inboxIssue.support_ticket?.sla_due_at,
    inboxIssue.support_ticket?.ticket_number,
  ]);

  const visibleFields = useMemo(() => {
    const fields = inboxIssue.support_ticket?.submission_fields ?? [];
    return fields
      .map((field) => {
        const displayValue = formatSubmissionValue(field.value, t);
        return {
          ...field,
          displayValue,
          kind: classifyField(field, displayValue),
        } satisfies ClassifiedField;
      })
      .filter((field) => field.kind !== "skip" && field.displayValue.length > 0);
  }, [inboxIssue.support_ticket?.submission_fields, t]);

  const hasSubmissionFields = visibleFields.length > 0;
  const canResetSla = Boolean(criticality);

  const handleSaveSupport = async () => {
    setSaving(true);
    try {
      await inboxIssue.updateSupportTicket({
        support_criticality: criticality,
        support_sla_due_at: toIsoOrEmpty(slaDueAt),
        support_ticket_number: ticketNumber.trim(),
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.success"),
        message: t("inbox_issue.support_triage.saved"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("something_went_wrong"),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetSla = async () => {
    if (!criticality) return;
    setResetting(true);
    try {
      await inboxIssue.updateSupportTicket({
        support_criticality: criticality,
        reset_sla_from_criticality: true,
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.success"),
        message: t("inbox_issue.support_triage.reset_success"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("something_went_wrong"),
      });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-4 px-4">
      {hasSubmissionFields ? (
        <section className="shadow-xs overflow-hidden rounded-xl border border-subtle bg-layer-1/50">
          <h5 className="border-b border-subtle/80 px-5 py-3.5 text-13 font-semibold text-primary">
            {t("inbox_issue.sections.support_form")}
          </h5>

          <dl className="divide-y divide-subtle/70 px-5">
            {visibleFields.map((field, index) => (
              <div
                key={`${field.label}-${index}`}
                className="grid gap-x-5 gap-y-1.5 py-3.5 sm:grid-cols-[minmax(7.5rem,28%)_1fr] sm:items-start"
              >
                <dt className="text-11 font-medium tracking-wide text-tertiary uppercase">{field.label}</dt>
                <dd className="min-w-0">
                  <FieldValue field={field} />
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <section className="shadow-xs overflow-hidden rounded-xl border border-subtle bg-layer-1/50">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-subtle/80 px-5 py-3.5">
          <h5 className="text-14 font-semibold text-primary">{t("inbox_issue.support_triage.title")}</h5>
          {inboxIssue.support_ticket?.sla_due_at_overridden ? (
            <span className="rounded-full border border-warning-subtle bg-warning-subtle/40 px-2.5 py-1 text-11 font-medium text-warning-primary">
              {t("inbox_issue.support_triage.manual_override")}
            </span>
          ) : null}
        </div>

        <div className="grid gap-5 px-5 py-5 sm:grid-cols-3">
          <label className="block min-w-0 space-y-2">
            <span className="text-11 font-medium tracking-wide text-tertiary uppercase">
              {t("inbox_issue.support_triage.criticality")}
            </span>
            <div className={cn(FIELD_SHELL_CLASS, "relative flex items-center")}>
              {criticality ? (
                <span
                  className={cn(
                    "pointer-events-none absolute left-3 size-2 rounded-full",
                    CRITICALITY_DOT[criticality as TSupportCriticality]
                  )}
                  aria-hidden
                />
              ) : null}
              <select
                className={cn(FIELD_INPUT_CLASS, "h-10", criticality ? "pl-4" : undefined)}
                value={criticality}
                onChange={(event) => setCriticality(event.target.value as TSupportCriticality)}
              >
                <option value="">{t("intake_public_form.select_placeholder")}</option>
                {CRITICALITY_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {t(`intake_public_form.criticality_${value}`)}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="block min-w-0 space-y-2">
            <span className="text-11 font-medium tracking-wide text-tertiary uppercase">
              {t("inbox_issue.support_triage.ticket_number")}
            </span>
            <div className={FIELD_SHELL_CLASS}>
              <input
                className={FIELD_INPUT_CLASS}
                value={ticketNumber}
                onChange={(event) => setTicketNumber(event.target.value)}
                placeholder="INC-2026-0042"
              />
            </div>
          </label>

          <label className="block min-w-0 space-y-2">
            <span className="text-11 font-medium tracking-wide text-tertiary uppercase">
              {t("inbox_issue.support_triage.sla_due_at")}
            </span>
            <div className={FIELD_SHELL_CLASS}>
              <input
                type="datetime-local"
                className={cn(
                  FIELD_INPUT_CLASS,
                  "tabular-nums [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60"
                )}
                value={slaDueAt}
                onChange={(event) => setSlaDueAt(event.target.value)}
              />
            </div>
          </label>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-subtle/80 bg-layer-2/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-12 text-tertiary">{t("inbox_issue.support_triage.footer_hint")}</p>
          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            <Button
              variant="tertiary"
              size="sm"
              className="h-9"
              disabled={!canResetSla}
              loading={resetting}
              onClick={() => void handleResetSla()}
            >
              <RotateCcw className="size-3.5" />
              <span className="hidden sm:inline">{t("inbox_issue.support_triage.reset_sla")}</span>
              <span className="sm:hidden">{t("inbox_issue.support_triage.reset_sla_short")}</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="h-9 min-w-[5.5rem]"
              loading={saving}
              onClick={() => void handleSaveSupport()}
            >
              {t("common.save")}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
});
