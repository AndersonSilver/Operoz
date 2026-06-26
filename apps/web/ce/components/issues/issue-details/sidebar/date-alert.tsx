import { differenceInCalendarDays, parseISO } from "date-fns";
import { useTranslation } from "@operis/i18n";
import { Badge } from "@operis/ui";
import type { TIssue } from "@operis/types";

export type TDateAlertProps = {
  date: string;
  workItem: TIssue;
  projectId: string;
};

export function DateAlert({ date }: TDateAlertProps) {
  const { t } = useTranslation();

  if (!date) {
    return (
      <Badge variant="neutral" size="sm" disabled>
        {t("date_alert.no_date")}
      </Badge>
    );
  }

  const daysUntil = differenceInCalendarDays(parseISO(date), new Date());

  if (daysUntil < 0) {
    return (
      <Badge variant="destructive" size="sm" disabled>
        {t("date_alert.overdue", { days: Math.abs(daysUntil) })}
      </Badge>
    );
  }

  if (daysUntil <= 3) {
    return (
      <Badge variant="warning" size="sm" disabled>
        {t("date_alert.due_soon_urgent", { days: daysUntil })}
      </Badge>
    );
  }

  if (daysUntil <= 7) {
    return (
      <Badge variant="warning" size="sm" disabled>
        {t("date_alert.due_soon", { days: daysUntil })}
      </Badge>
    );
  }

  return (
    <Badge variant="success" size="sm" disabled>
      {t("date_alert.due_soon", { days: daysUntil })}
    </Badge>
  );
}
