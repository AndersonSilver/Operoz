import { BellRing } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Tooltip } from "@operis/propel/tooltip";
import { cn } from "@operis/utils";

type Props = {
  scoreAlertThreshold: number;
  className?: string;
};

export function Client360HealthScoreAlertBadge({ scoreAlertThreshold, className }: Props) {
  const { t } = useTranslation();

  return (
    <Tooltip
      position="top"
      tooltipHeading={t("boards.client_360.score_alert_badge")}
      tooltipContent={t("boards.client_360.score_alert_badge_tooltip", {
        threshold: scoreAlertThreshold,
      })}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-sm border border-danger-subtle bg-danger-subtle px-1.5 py-0.5 text-10 font-semibold tracking-wide text-danger-primary uppercase",
          className
        )}
      >
        <BellRing className="size-3 shrink-0" strokeWidth={2} aria-hidden />
        {t("boards.client_360.score_alert_badge")}
      </span>
    </Tooltip>
  );
}
