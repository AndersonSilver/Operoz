"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Banknote, ChevronDown, Clock, DollarSign, Pencil, Tag, TrendingUp } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { TClient360FinopsPayload, TClient360FinopsProfileWrite } from "@operis/types";
import { cn } from "@operis/utils";
import { Input } from "@operis/ui";
import { Client360BentoTile } from "@/components/board/client-360/client-360-bento";
import { Client360MetaChip } from "@/components/board/client-360/client-360-ui";
import { formatClient360Currency } from "@/components/board/client-360/client-360-utils";
import { useClient360SectionOpen } from "@/components/board/client-360/use-client-360-section-open";
import { WorkspaceService } from "@/services/workspace.service";

const workspaceService = new WorkspaceService();

type FormState = {
  budget_planned: string;
  budget_actual: string;
  revenue_contract: string;
  harness_cost_mtd: string;
  hours_allocated: string;
  capacity_hours: string;
  harness_project_tag: string;
};

function finopsToForm(finops: TClient360FinopsPayload): FormState {
  return {
    budget_planned: finops.budget_planned != null ? String(finops.budget_planned) : "",
    budget_actual: finops.budget_actual != null ? String(finops.budget_actual) : "",
    revenue_contract: finops.revenue_contract != null ? String(finops.revenue_contract) : "",
    harness_cost_mtd: finops.harness_cost_mtd != null ? String(finops.harness_cost_mtd) : "",
    hours_allocated: finops.utilization?.hours_allocated != null ? String(finops.utilization.hours_allocated) : "",
    capacity_hours: finops.utilization?.capacity_hours != null ? String(finops.utilization.capacity_hours) : "160",
    harness_project_tag: finops.harness_project_tag ?? "",
  };
}

function hasFinopsProfileData(finops: TClient360FinopsPayload): boolean {
  return (
    finops.budget_planned != null ||
    finops.budget_actual != null ||
    finops.revenue_contract != null ||
    finops.harness_cost_mtd != null ||
    (finops.utilization?.hours_allocated ?? 0) > 0 ||
    Boolean(finops.harness_project_tag?.trim())
  );
}

function parseOptionalDecimal(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed.replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

function parseRequiredDecimal(raw: string, fallback: number): number {
  const value = parseOptionalDecimal(raw);
  return value ?? fallback;
}

function formToPayload(form: FormState): TClient360FinopsProfileWrite {
  return {
    budget_planned: parseOptionalDecimal(form.budget_planned),
    budget_actual: parseOptionalDecimal(form.budget_actual),
    revenue_contract: parseOptionalDecimal(form.revenue_contract),
    harness_cost_mtd: parseOptionalDecimal(form.harness_cost_mtd),
    hours_allocated: parseRequiredDecimal(form.hours_allocated, 0),
    capacity_hours: parseRequiredDecimal(form.capacity_hours, 160),
    harness_project_tag: form.harness_project_tag.trim(),
  };
}

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "number" | "text";
};

function FinopsField({ id, label, value, onChange, placeholder, type = "number" }: FieldProps) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1">
      <span className="text-12 font-medium text-secondary">{label}</span>
      <Input
        id={id}
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        step={type === "number" ? "0.01" : undefined}
        min={type === "number" ? "0" : undefined}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="text-13"
      />
    </label>
  );
}

type Props = {
  workspaceSlug: string;
  projectId: string;
  finops: TClient360FinopsPayload;
  onSaved?: () => void;
};

export function Client360FinopsProfileForm({ workspaceSlug, projectId, finops, onSaved }: Props) {
  const { t } = useTranslation();
  const baseline = useMemo(() => finopsToForm(finops), [finops]);
  const [form, setForm] = useState<FormState>(baseline);
  const [saving, setSaving] = useState(false);
  const hasData = hasFinopsProfileData(finops);
  const { open, setOpen, toggle } = useClient360SectionOpen(`finops-form:${projectId}`, !hasData);

  useEffect(() => {
    setForm(finopsToForm(finops));
  }, [finops]);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseline), [baseline, form]);

  const setField = useCallback((key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  }, []);

  const handleReset = useCallback(() => {
    setForm(baseline);
  }, [baseline]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await workspaceService.updateClient360FinopsProfile(workspaceSlug, projectId, formToPayload(form));
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("boards.client_360.finops_form_saved_title"),
        message: t("boards.client_360.finops_form_saved_message"),
      });
      onSaved?.();
      setOpen(false);
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("boards.client_360.finops_form_save_error"),
      });
    } finally {
      setSaving(false);
    }
  }, [form, onSaved, projectId, setOpen, t, workspaceSlug]);

  const readChips = (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {(finops.budget_planned != null || finops.budget_actual != null) && (
        <Client360MetaChip icon={Banknote} tone="neutral">
          {t("boards.client_360.finops_read_budget", {
            planned:
              finops.budget_planned != null
                ? formatClient360Currency(finops.budget_planned)
                : t("boards.client_360.finops_not_set"),
            actual:
              finops.budget_actual != null
                ? formatClient360Currency(finops.budget_actual)
                : t("boards.client_360.finops_not_set"),
          })}
        </Client360MetaChip>
      )}
      {finops.revenue_contract != null ? (
        <Client360MetaChip icon={TrendingUp} tone="success">
          {t("boards.client_360.finops_read_revenue", {
            value: formatClient360Currency(finops.revenue_contract),
          })}
        </Client360MetaChip>
      ) : null}
      {finops.harness_cost_mtd != null ? (
        <Client360MetaChip icon={DollarSign} tone="info">
          {t("boards.client_360.finops_read_harness", {
            value: formatClient360Currency(finops.harness_cost_mtd),
          })}
        </Client360MetaChip>
      ) : null}
      {(finops.utilization?.hours_allocated ?? 0) > 0 || (finops.utilization?.capacity_hours ?? 0) > 0 ? (
        <Client360MetaChip icon={Clock} tone={finops.utilization?.over_allocated ? "danger" : "neutral"}>
          {t("boards.client_360.finops_capacity_hours", {
            allocated: finops.utilization?.hours_allocated ?? 0,
            capacity: finops.utilization?.capacity_hours ?? 0,
          })}
        </Client360MetaChip>
      ) : null}
      {finops.harness_project_tag?.trim() ? (
        <Client360MetaChip icon={Tag} tone="neutral">
          {finops.harness_project_tag}
        </Client360MetaChip>
      ) : null}
    </div>
  );

  return (
    <Client360BentoTile
      title={t("boards.client_360.finops_form_title")}
      icon={Pencil}
      iconTone="neutral"
      action={
        <Button variant="ghost" size="sm" onClick={toggle} aria-expanded={open}>
          {open ? t("boards.client_360.finops_form_collapse") : t("boards.client_360.finops_form_edit")}
          <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} strokeWidth={1.75} />
        </Button>
      }
    >
      {!open ? (
        hasData ? (
          readChips
        ) : (
          <p className="text-13 leading-relaxed text-tertiary">{t("boards.client_360.finops_form_read_empty")}</p>
        )
      ) : (
        <>
          <p className="mb-4 text-12 leading-relaxed text-tertiary">{t("boards.client_360.finops_form_subtitle")}</p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <FinopsField
              id="finops-budget-planned"
              label={t("boards.client_360.finops_form_budget_planned")}
              value={form.budget_planned}
              onChange={(value) => setField("budget_planned", value)}
            />
            <FinopsField
              id="finops-budget-actual"
              label={t("boards.client_360.finops_form_budget_actual")}
              value={form.budget_actual}
              onChange={(value) => setField("budget_actual", value)}
            />
            <FinopsField
              id="finops-revenue"
              label={t("boards.client_360.finops_form_revenue")}
              value={form.revenue_contract}
              onChange={(value) => setField("revenue_contract", value)}
            />
            <FinopsField
              id="finops-harness-cost"
              label={t("boards.client_360.finops_form_harness_cost")}
              value={form.harness_cost_mtd}
              onChange={(value) => setField("harness_cost_mtd", value)}
            />
            <FinopsField
              id="finops-hours-allocated"
              label={t("boards.client_360.finops_form_hours_allocated")}
              value={form.hours_allocated}
              onChange={(value) => setField("hours_allocated", value)}
            />
            <FinopsField
              id="finops-capacity-hours"
              label={t("boards.client_360.finops_form_capacity_hours")}
              value={form.capacity_hours}
              onChange={(value) => setField("capacity_hours", value)}
            />
            <FinopsField
              id="finops-harness-tag"
              label={t("boards.client_360.finops_form_harness_tag")}
              type="text"
              value={form.harness_project_tag}
              placeholder={t("boards.client_360.finops_form_harness_tag_placeholder")}
              onChange={(value) => setField("harness_project_tag", value)}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-subtle pt-4">
            <Button
              variant="primary"
              size="sm"
              loading={saving}
              disabled={!dirty || saving}
              onClick={() => void handleSave()}
            >
              {t("boards.client_360.finops_form_save")}
            </Button>
            <Button variant="secondary" size="sm" disabled={!dirty || saving} onClick={handleReset}>
              {t("boards.client_360.finops_form_reset")}
            </Button>
          </div>
        </>
      )}
    </Client360BentoTile>
  );
}
