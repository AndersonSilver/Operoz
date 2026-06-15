"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DollarSign } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { TClient360FinopsPayload, TClient360FinopsProfileWrite } from "@operis/types";
import { Input } from "@operis/ui";
import { Client360Section } from "@/components/board/client-360/client-360-ui";
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
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function FinopsField({ id, label, hint, value, onChange, placeholder }: FieldProps) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-12 font-medium text-secondary">{label}</span>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="text-13"
      />
      {hint ? <span className="text-11 leading-relaxed text-tertiary">{hint}</span> : null}
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
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("boards.client_360.finops_form_save_error"),
      });
    } finally {
      setSaving(false);
    }
  }, [form, onSaved, projectId, t, workspaceSlug]);

  return (
    <Client360Section
      icon={DollarSign}
      iconTone="accent"
      title={t("boards.client_360.finops_form_title")}
      description={t("boards.client_360.finops_form_subtitle")}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <FinopsField
          id="finops-budget-planned"
          label={t("boards.client_360.finops_form_budget_planned")}
          hint={t("boards.client_360.finops_form_budget_planned_hint")}
          value={form.budget_planned}
          onChange={(value) => setField("budget_planned", value)}
        />
        <FinopsField
          id="finops-budget-actual"
          label={t("boards.client_360.finops_form_budget_actual")}
          hint={t("boards.client_360.finops_form_budget_actual_hint")}
          value={form.budget_actual}
          onChange={(value) => setField("budget_actual", value)}
        />
        <FinopsField
          id="finops-revenue"
          label={t("boards.client_360.finops_form_revenue")}
          hint={t("boards.client_360.finops_form_revenue_hint")}
          value={form.revenue_contract}
          onChange={(value) => setField("revenue_contract", value)}
        />
        <FinopsField
          id="finops-harness-cost"
          label={t("boards.client_360.finops_form_harness_cost")}
          hint={t("boards.client_360.finops_form_harness_cost_hint")}
          value={form.harness_cost_mtd}
          onChange={(value) => setField("harness_cost_mtd", value)}
        />
        <FinopsField
          id="finops-hours-allocated"
          label={t("boards.client_360.finops_form_hours_allocated")}
          hint={t("boards.client_360.finops_form_hours_allocated_hint")}
          value={form.hours_allocated}
          onChange={(value) => setField("hours_allocated", value)}
        />
        <FinopsField
          id="finops-capacity-hours"
          label={t("boards.client_360.finops_form_capacity_hours")}
          hint={t("boards.client_360.finops_form_capacity_hours_hint")}
          value={form.capacity_hours}
          onChange={(value) => setField("capacity_hours", value)}
        />
        <label htmlFor="finops-harness-tag" className="flex flex-col gap-1.5 md:col-span-2 xl:col-span-3">
          <span className="text-12 font-medium text-secondary">{t("boards.client_360.finops_form_harness_tag")}</span>
          <Input
            id="finops-harness-tag"
            type="text"
            value={form.harness_project_tag}
            placeholder={t("boards.client_360.finops_form_harness_tag_placeholder")}
            onChange={(event) => setField("harness_project_tag", event.target.value)}
            className="text-13"
          />
          <span className="text-11 leading-relaxed text-tertiary">
            {t("boards.client_360.finops_form_harness_tag_hint")}
          </span>
        </label>
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
    </Client360Section>
  );
}
