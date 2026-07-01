"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Clock, Gauge, Timer } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { IBoard, TBoardSupportSlaPolicyRules, TSupportCriticality } from "@operoz/types";
import { Input, Loader } from "@operoz/ui";
import { cn } from "@operoz/utils";
import { boardSupportSlaPolicyService } from "@/services/board/board-support-sla-policy.service";
import { SupportSettingsHero } from "@/components/settings/board/support/support-settings-hero";

const CRITICALITY_ORDER: TSupportCriticality[] = ["p0", "p1", "p2", "p3", "p4", "not_incident"];

const CRITICALITY_DOT: Record<TSupportCriticality, string> = {
  p0: "bg-danger-primary",
  p1: "bg-warning-primary",
  p2: "bg-[#f97316]",
  p3: "bg-accent-primary",
  p4: "bg-tertiary",
  not_incident: "bg-subtle-foreground/40",
};

type Props = {
  workspaceSlug: string;
  board: IBoard;
};

function minutesToHoursLabel(
  minutes: number,
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  if (minutes < 60) return t("boards.settings.support_sla.minutes_label", { value: minutes });
  if (minutes % 60 === 0) return t("boards.settings.support_sla.hours_label", { value: minutes / 60 });
  return t("boards.settings.support_sla.hours_minutes_label", {
    hours: Math.floor(minutes / 60),
    minutes: minutes % 60,
  });
}

export const BoardSupportSlaSettings = observer(function BoardSupportSlaSettings({ workspaceSlug, board }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<TBoardSupportSlaPolicyRules | null>(null);

  const loadPolicy = useCallback(async () => {
    const response = await boardSupportSlaPolicyService.retrieve(workspaceSlug, board.slug);
    setValues(response.policies);
  }, [board.slug, workspaceSlug]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadPolicy()
      .catch(() => {
        if (!cancelled) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: t("boards.settings.support_sla.load_error"),
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadPolicy]);

  const hasInvalidValue = useMemo(
    () =>
      !values ||
      CRITICALITY_ORDER.some((criticality) => {
        const value = values[criticality]?.duration_minutes ?? 0;
        return !Number.isFinite(value) || value <= 0;
      }),
    [values]
  );

  const handleSave = async () => {
    if (!values || hasInvalidValue) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("boards.settings.support_sla.invalid_value"),
      });
      return;
    }

    setSaving(true);
    try {
      const updated = await boardSupportSlaPolicyService.update(workspaceSlug, board.slug, { policies: values });
      setValues(updated.policies);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.settings.support_sla.saved"),
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

  if (loading || !values) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader className="w-full max-w-xs">
          <Loader.Item height="32px" width="100%" />
        </Loader>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SupportSettingsHero
        icon={Timer}
        title={t("boards.settings.support_sla.title")}
        description={t("boards.settings.support_sla.subtitle")}
        highlights={[
          { label: t("boards.settings.support_sla.highlight_auto"), icon: Gauge, tone: "accent" },
          { label: t("boards.settings.support_sla.highlight_deadline"), icon: Clock, tone: "warning" },
        ]}
        gradientClass="from-warning-subtle/25"
        accentClass="border border-subtle bg-warning-subtle/30 text-warning-primary"
      />

      <section className="shadow-xs overflow-hidden rounded-xl border border-subtle bg-layer-1">
        <header className="border-b border-subtle/80 bg-layer-2/30 px-5 py-3.5">
          <p className="text-13 font-semibold text-primary">{t("boards.settings.support_sla.grid_title")}</p>
          <p className="mt-0.5 text-12 text-tertiary">{t("boards.settings.support_sla.grid_subtitle")}</p>
        </header>

        <div className="divide-y divide-subtle/70">
          {CRITICALITY_ORDER.map((criticality) => {
            const current = values[criticality]?.duration_minutes ?? 0;
            return (
              <div
                key={criticality}
                className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_140px_minmax(0,1fr)] md:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className={cn("size-2.5 shrink-0 rounded-full", CRITICALITY_DOT[criticality])} aria-hidden />
                  <p className="text-13 font-medium text-primary">
                    {t(`intake_public_form.criticality_${criticality}`)}
                  </p>
                </div>
                <div className="shadow-xs focus-within:ring-accent-primary/15 rounded-lg border border-subtle bg-surface-1 px-3 focus-within:border-accent-strong focus-within:ring-2">
                  <Input
                    type="number"
                    min={1}
                    value={current}
                    onChange={(event) => {
                      const nextValue = Math.max(0, Number(event.target.value || 0));
                      setValues((prev) =>
                        prev
                          ? {
                              ...prev,
                              [criticality]: { duration_minutes: nextValue },
                            }
                          : prev
                      );
                    }}
                    className="h-10 border-0 bg-transparent shadow-none focus:ring-0"
                  />
                </div>
                <p className="text-12 text-tertiary md:text-right">{minutesToHoursLabel(current, t)}</p>
              </div>
            );
          })}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-subtle/80 bg-layer-2/20 px-5 py-4">
          <p className="text-12 text-tertiary">{t("boards.settings.support_sla.footer_hint")}</p>
          <Button
            variant="primary"
            size="sm"
            className="h-9 min-w-[5.5rem]"
            loading={saving}
            onClick={() => void handleSave()}
          >
            {t("common.save")}
          </Button>
        </footer>
      </section>
    </div>
  );
});
