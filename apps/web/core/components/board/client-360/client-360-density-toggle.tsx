import { Rows3 } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { IconButton } from "@operis/propel/icon-button";
import { Tooltip } from "@operis/propel/tooltip";
import { cn } from "@operis/utils";
import type { Client360RowDensity } from "@/components/board/client-360/client-360-row-density";

type Props = {
  density: Client360RowDensity;
  onToggle: () => void;
  className?: string;
};

export function Client360DensityToggle({ density, onToggle, className }: Props) {
  const { t } = useTranslation();
  const isCompact = density === "compact";
  const label = isCompact ? t("boards.client_360.density_compact") : t("boards.client_360.density_comfortable");

  return (
    <Tooltip tooltipContent={t("boards.client_360.density_toggle", { mode: label })}>
      <span className={cn("inline-flex", className)}>
        <IconButton
          variant="secondary"
          size="xl"
          icon={Rows3}
          aria-label={t("boards.client_360.density_toggle", { mode: label })}
          aria-pressed={isCompact}
          onClick={onToggle}
          className={cn("shrink-0 rounded-sm", isCompact && "text-accent-primary")}
        />
      </span>
    </Tooltip>
  );
}
