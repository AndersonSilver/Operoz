import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  FileText,
  Info,
  Layers3,
  Search,
  Send,
  Tag,
} from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { IconButton } from "@operis/propel/icon-button";
import type { IModule, TStatusReportKind } from "@operis/types";
import { EModalPosition, EModalWidth, ModalCore, TextArea } from "@operis/ui";
import { cn, renderFormattedPeriodDatesLong } from "@operis/utils";
import { parseModuleDisplayName } from "@/components/project/status-report/status-report-utils";

type MultiReportKind = Extract<TStatusReportKind, "sprint" | "multi_module">;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  modules: IModule[] | undefined;
  moduleIds: string[];
  setModuleIds: (ids: string[]) => void;
  reportScope: MultiReportKind;
  setReportScope: (value: MultiReportKind) => void;
  sprintTitle: string;
  setSprintTitle: (value: string) => void;
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
        <h3 className="text-caption-sm-medium tracking-wide text-tertiary uppercase">{title}</h3>
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
    moduleIds,
    setModuleIds,
    reportScope,
    setReportScope,
    sprintTitle,
    setSprintTitle,
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
  const [moduleSearch, setModuleSearch] = useState("");

  useEffect(() => {
    if (!isOpen) setModuleSearch("");
  }, [isOpen]);

  const periodDatesLabel = renderFormattedPeriodDatesLong(periodStart, periodEnd);
  const selectedCount = moduleIds.length;
  const isMultiSelection = selectedCount > 1;
  const reportHint =
    selectedCount <= 1
      ? t("project.status_report.multi_module.module_hint")
      : reportScope === "sprint"
        ? t("project.status_report.multi_module.sprint_hint", { count: selectedCount })
        : t("project.status_report.multi_module.selection_hint", { count: selectedCount });

  const filteredModules = useMemo(() => {
    const list = modules ?? [];
    const q = moduleSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((module) => {
      const parsed = parseModuleDisplayName(module.name);
      const haystack = [module.name, parsed.title, parsed.subtitle, parsed.code, parsed.client]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [moduleSearch, modules]);

  const toggleModule = (id: string) => {
    if (moduleIds.includes(id)) {
      const next = moduleIds.filter((item) => item !== id);
      if (next.length > 0) setModuleIds(next);
      return;
    }
    if (moduleIds.length >= 10) return;
    setModuleIds([...moduleIds, id]);
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.XXXL}>
      <div className="flex flex-col">
        <div className="border-b border-subtle px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-subtle bg-accent-primary/10 text-accent-primary">
              <FilePlus2 className="size-4" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <h3 className="text-body-sm-medium text-primary">{t("project.status_report.create_title")}</h3>
              <p className="mt-1 text-caption-sm-regular text-tertiary">{t("project.status_report.create_subtitle")}</p>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          <FormSection title={t("project.status_report.multi_module.section_title")} icon={Layers3}>
            <div className="flex h-9 items-center gap-2 rounded-md border border-subtle/50 bg-layer-2/60 px-2.5">
              <Search className="size-3.5 shrink-0 text-tertiary" strokeWidth={1.75} />
              <input
                className="w-full border-none bg-transparent text-13 text-primary placeholder:text-placeholder focus:outline-none"
                placeholder={t("project.status_report.multi_module.search_placeholder")}
                value={moduleSearch}
                onChange={(e) => setModuleSearch(e.target.value)}
              />
            </div>
            <div className="max-h-56 divide-y divide-subtle overflow-y-auto rounded-lg border border-subtle">
              {filteredModules.length === 0 ? (
                <p className="px-3 py-6 text-center text-13 text-tertiary">
                  {t("project.status_report.multi_module.search_empty")}
                </p>
              ) : null}
              {filteredModules.map((module: IModule) => {
                const selected = moduleIds.includes(module.id);
                const parsed = parseModuleDisplayName(module.name);
                return (
                  <button
                    key={module.id}
                    type="button"
                    className={cn(
                      "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-layer-transparent-hover",
                      selected && "bg-accent-primary/5"
                    )}
                    onClick={() => toggleModule(module.id)}
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid size-4 shrink-0 place-items-center rounded-sm border border-subtle",
                        selected && "border-accent-primary bg-accent-primary text-white"
                      )}
                    >
                      {selected ? <Check className="size-3" strokeWidth={2.5} /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-13 leading-snug font-medium text-primary">{parsed.title}</span>
                      {parsed.subtitle ? (
                        <span className="mt-0.5 block text-11 leading-snug text-tertiary">{parsed.subtitle}</span>
                      ) : (
                        <span className="mt-0.5 block truncate text-11 text-tertiary" title={module.name}>
                          {module.name}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            {moduleSearch.trim() ? (
              <p className="text-caption-sm-regular text-tertiary">
                {t("project.status_report.multi_module.search_results", { count: filteredModules.length })}
              </p>
            ) : null}
            <p className="text-caption-sm-regular text-tertiary">
              {t("project.status_report.multi_module.selected_count", { count: selectedCount })}
            </p>
            <div className="flex items-start gap-2 rounded-md border border-subtle/80 bg-layer-2/25 px-3 py-2">
              <Info className="mt-0.5 size-3.5 shrink-0 text-placeholder" strokeWidth={1.75} />
              <p className="text-caption-sm-regular leading-relaxed text-tertiary">{reportHint}</p>
            </div>
          </FormSection>

          {isMultiSelection ? (
            <FormSection title={t("project.status_report.multi_module.report_type_label")} icon={Layers3}>
              <div className="grid gap-2 sm:grid-cols-2">
                <ReportKindOption
                  active={reportScope === "sprint"}
                  title={t("project.status_report.multi_module.report_kind_sprint")}
                  description={t("project.status_report.multi_module.report_kind_sprint_desc")}
                  onSelect={() => setReportScope("sprint")}
                />
                <ReportKindOption
                  active={reportScope === "multi_module"}
                  title={t("project.status_report.multi_module.report_kind_selection")}
                  description={t("project.status_report.multi_module.report_kind_selection_desc")}
                  onSelect={() => setReportScope("multi_module")}
                />
              </div>
            </FormSection>
          ) : null}

          {isMultiSelection && reportScope === "sprint" ? (
            <FormSection title={t("project.status_report.multi_module.sprint_title_label")} icon={Tag}>
              <input
                className="h-9 w-full rounded-md border border-subtle bg-layer-1 px-3 text-13 text-primary placeholder:text-placeholder focus:border-strong focus:outline-none"
                placeholder={t("project.status_report.multi_module.sprint_title_placeholder")}
                value={sprintTitle}
                onChange={(e) => setSprintTitle(e.target.value)}
                maxLength={255}
                autoFocus
              />
              <p className="text-caption-sm-regular text-tertiary">
                {t("project.status_report.multi_module.sprint_title_hint")}
              </p>
            </FormSection>
          ) : null}

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
            disabled={
              moduleIds.length === 0 ||
              !modules?.length ||
              (isMultiSelection && reportScope === "sprint" && !sprintTitle.trim())
            }
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

function ReportKindOption({
  active,
  title,
  description,
  onSelect,
}: {
  active: boolean;
  title: string;
  description: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-lg border px-3 py-2.5 text-left transition-colors",
        active
          ? "border-accent-primary ring-accent-primary/30 bg-accent-primary/5 ring-1"
          : "border-subtle bg-layer-1 hover:bg-layer-transparent-hover"
      )}
    >
      <span className="block text-13 font-medium text-primary">{title}</span>
      <span className="mt-1 block text-11 leading-snug text-tertiary">{description}</span>
    </button>
  );
}
