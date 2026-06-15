import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { IconButton } from "@operis/propel/icon-button";
import { cn, renderFormattedDate } from "@operis/utils";
import { defaultWeekPeriod, shiftWeekPeriod } from "@/components/board/client-360/client-360-utils";
import { Client360PeriodCompareToggle } from "@/components/board/client-360/client-360-period-compare-toggle";

type Props = {
  period: { start: string; end: string };
  onPeriodChange: (period: { start: string; end: string }) => void;
  className?: string;
  compareEnabled?: boolean;
  onCompareChange?: (enabled: boolean) => void;
  compareAvailable?: boolean;
  /** Compact pill for detail header toolbar */
  compact?: boolean;
};

export function Client360WeekNav({
  period,
  onPeriodChange,
  className,
  compareEnabled = false,
  onCompareChange,
  compareAvailable = true,
  compact = false,
}: Props) {
  const { t } = useTranslation();
  const current = defaultWeekPeriod();
  const isCurrentWeek = period.start === current.start && period.end === current.end;
  const label = `${renderFormattedDate(period.start)} — ${renderFormattedDate(period.end)}`;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", compact ? "justify-end" : "justify-end", className)}>
      <div
        className={cn(
          "flex items-center border border-subtle bg-layer-2/80",
          compact ? "shadow-xs rounded-lg" : "rounded-sm"
        )}
      >
        <IconButton
          variant="ghost"
          size="sm"
          icon={ChevronLeft}
          aria-label={t("boards.client_360.week_prev")}
          onClick={() => onPeriodChange(shiftWeekPeriod(period.start, -1))}
        />
        <div className={cn("border-x border-subtle text-center", compact ? "px-3 py-1" : "px-3 py-1.5")}>
          <p className="tracking-wider text-10 font-semibold text-tertiary uppercase">
            {t("boards.client_360.period_label")}
          </p>
          <p className={cn("font-medium text-primary", compact ? "min-w-[160px] text-11" : "min-w-[180px] text-12")}>
            {label}
          </p>
        </div>
        <IconButton
          variant="ghost"
          size="sm"
          icon={ChevronRight}
          aria-label={t("boards.client_360.week_next")}
          onClick={() => onPeriodChange(shiftWeekPeriod(period.start, 1))}
          disabled={isCurrentWeek}
        />
      </div>
      {!isCurrentWeek ? (
        <button
          type="button"
          onClick={() => onPeriodChange(current)}
          className="rounded-lg px-2.5 py-1 text-11 font-medium text-secondary transition-colors hover:bg-layer-transparent-hover hover:text-primary"
        >
          {t("boards.client_360.week_today")}
        </button>
      ) : null}
      {onCompareChange ? (
        <Client360PeriodCompareToggle
          enabled={compareEnabled}
          onChange={onCompareChange}
          available={compareAvailable}
        />
      ) : null}
    </div>
  );
}
