import type { LucideIcon } from "lucide-react";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  FileText,
  Info,
  Layers3,
  Send,
} from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { IconButton } from "@operis/propel/icon-button";
import type { IModule } from "@operis/types";
import { CustomSelect, EModalPosition, EModalWidth, ModalCore, TextArea } from "@operis/ui";
import { cn, renderFormattedPeriodDatesLong } from "@operis/utils";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  modules: IModule[] | undefined;
  moduleId: string;
  setModuleId: (id: string) => void;
  periodStart: string;
  periodEnd: string;
  onShiftWeek: (delta: number) => void;
  weekLabel: string;
  summary: string;
  setSummary: (value: string) => void;
  creating: boolean;
  onCreate: () => void;
};

function FormSection({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-2.5", className)}>
      <div className="flex items-center gap-2">
        {Icon && (
          <span className="grid size-6 shrink-0 place-items-center rounded-md border border-subtle bg-layer-2/60 text-accent-primary">
            <Icon className="size-3.5" strokeWidth={1.75} />
          </span>
        )}
        <h3 className="text-caption-sm-medium uppercase tracking-wide text-tertiary">{title}</h3>
      </div>
      {children}
    </section>
  );
}

export function ProjectStatusReportCreateModal(props: Props) {
  const {
    isOpen,
    onClose,
    modules,
    moduleId,
    setModuleId,
    periodStart,
    periodEnd,
    onShiftWeek,
    weekLabel,
    summary,
    setSummary,
    creating,
    onCreate,
  } = props;
  const { t } = useTranslation();

  const periodDatesLabel = renderFormattedPeriodDatesLong(periodStart, periodEnd);

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.LG}>
      <div className="flex flex-col">
        <div className="border-b border-subtle px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-subtle bg-accent-primary/10 text-accent-primary">
              <FilePlus2 className="size-4" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <h3 className="text-body-sm-medium text-primary">{t("project.status_report.create_title")}</h3>
              <p className="mt-1 text-caption-sm-regular text-tertiary">
                {t("project.status_report.create_subtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          <FormSection title={t("project.status_report.form_section_module")} icon={Layers3}>
            <CustomSelect
              value={moduleId}
              onChange={(value: string) => setModuleId(value)}
              label={
                moduleId
                  ? modules?.find((m) => m.id === moduleId)?.name ?? t("project.status_report.module_placeholder")
                  : t("project.status_report.module_placeholder")
              }
              buttonClassName="w-full rounded-md"
            >
              {(modules ?? []).map((module: IModule) => (
                <CustomSelect.Option key={module.id} value={module.id}>
                  {module.name}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          </FormSection>

          <FormSection title={t("project.status_report.period_week_label")} icon={CalendarRange}>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-subtle bg-layer-2/30 px-2 py-2.5 sm:gap-3 sm:px-3 sm:py-3">
              <IconButton
                variant="ghost"
                size="sm"
                icon={ChevronLeft}
                onClick={() => onShiftWeek(-1)}
                aria-label={t("project.status_report.week_nav_prev")}
              />
              <div className="flex min-w-0 flex-1 items-center justify-center gap-2.5">
                <span className="hidden size-8 shrink-0 place-items-center rounded-md bg-layer-1 text-accent-primary sm:grid">
                  <CalendarRange className="size-4" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 text-center">
                  <p className="text-body-sm-medium text-primary">{weekLabel}</p>
                  <p className="mt-0.5 truncate text-caption-sm-regular text-tertiary" title={periodDatesLabel}>
                    {periodDatesLabel}
                  </p>
                </div>
              </div>
              <IconButton
                variant="ghost"
                size="sm"
                icon={ChevronRight}
                onClick={() => onShiftWeek(1)}
                aria-label={t("project.status_report.week_nav_next")}
              />
            </div>
          </FormSection>

          <FormSection title={t("project.status_report.form_section_content")} icon={FileText}>
            <TextArea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder={t("project.status_report.executive_summary_placeholder")}
              className="min-h-[88px] w-full resize-y rounded-md border-subtle bg-layer-1"
            />
            <div className="flex items-start gap-2 rounded-md border border-subtle/80 bg-layer-2/25 px-3 py-2">
              <Info className="mt-0.5 size-3.5 shrink-0 text-placeholder" strokeWidth={1.75} />
              <p className="text-caption-sm-regular leading-relaxed text-tertiary">
                {t("project.status_report.create_summary_hint")}
              </p>
            </div>
          </FormSection>
        </div>

        <div className="flex justify-end gap-2 border-t border-subtle px-5 py-4">
          <Button variant="secondary" type="button" onClick={onClose} disabled={creating}>
            {t("cancel")}
          </Button>
          <Button
            variant="primary"
            loading={creating}
            disabled={!moduleId || !modules?.length}
            onClick={onCreate}
            prependIcon={<Send className="size-4" />}
          >
            {t("project.status_report.create_button")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
