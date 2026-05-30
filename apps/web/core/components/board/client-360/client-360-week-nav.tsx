import { ChevronLeft, ChevronRight } from "lucide-react";

import { useTranslation } from "@operis/i18n";

import { IconButton } from "@operis/propel/icon-button";

import { cn, renderFormattedDate } from "@operis/utils";

import { defaultWeekPeriod, shiftWeekPeriod } from "@/components/board/client-360/client-360-utils";



type Props = {

  period: { start: string; end: string };

  onPeriodChange: (period: { start: string; end: string }) => void;

  className?: string;

};



export function Client360WeekNav({ period, onPeriodChange, className }: Props) {

  const { t } = useTranslation();

  const current = defaultWeekPeriod();

  const isCurrentWeek = period.start === current.start && period.end === current.end;



  const label = `${renderFormattedDate(period.start)} — ${renderFormattedDate(period.end)}`;



  return (

    <div className={cn("flex flex-wrap items-center justify-end gap-2", className)}>

      <div className="flex items-center rounded-sm border border-subtle bg-layer-2">

        <IconButton

          variant="ghost"

          size="sm"

          icon={ChevronLeft}

          aria-label={t("boards.client_360.week_prev")}

          onClick={() => onPeriodChange(shiftWeekPeriod(period.start, -1))}

        />

        <div className="border-x border-subtle px-3 py-1.5 text-center">

          <p className="text-10 font-medium uppercase tracking-wide text-tertiary">

            {t("boards.client_360.period_label")}

          </p>

          <p className="min-w-[180px] text-12 font-medium text-primary">{label}</p>

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

          className="rounded-sm px-2 py-1.5 text-12 font-medium text-secondary hover:bg-layer-transparent-hover hover:text-primary"

        >

          {t("boards.client_360.week_today")}

        </button>

      ) : null}

    </div>

  );

}


