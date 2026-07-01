import { useCallback, useState } from "react";
import { GitCompareArrows } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { IconButton } from "@operoz/propel/icon-button";
import { Tooltip } from "@operoz/propel/tooltip";
import { cn } from "@operoz/utils";

const STORAGE_PREFIX = "client360_period_compare";

function loadCompareEnabled(scope: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}_${scope}`) === "1";
  } catch {
    return false;
  }
}

function saveCompareEnabled(scope: string, enabled: boolean) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}_${scope}`, enabled ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function useClient360PeriodCompare(scope: string) {
  const [enabled, setEnabledState] = useState(() => loadCompareEnabled(scope));

  const setEnabled = useCallback(
    (next: boolean) => {
      setEnabledState(next);
      saveCompareEnabled(scope, next);
    },
    [scope]
  );

  const toggle = useCallback(() => {
    setEnabledState((prev) => {
      const next = !prev;
      saveCompareEnabled(scope, next);
      return next;
    });
  }, [scope]);

  return { enabled, setEnabled, toggle };
}

type ToggleProps = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  available?: boolean;
  className?: string;
  compact?: boolean;
};

export function Client360PeriodCompareToggle({
  enabled,
  onChange,
  available = true,
  className,
  compact = false,
}: ToggleProps) {
  const { t } = useTranslation();

  if (!available) return null;

  const label = t("boards.client_360.period_compare_label");

  return (
    <Tooltip tooltipContent={label}>
      <span className={cn("inline-flex h-full", className)}>
        <IconButton
          variant={enabled ? "primary" : "secondary"}
          icon={GitCompareArrows}
          aria-label={label}
          aria-pressed={enabled}
          className={cn("aspect-square !size-auto h-full shrink-0", compact ? "rounded-lg" : "rounded-sm")}
          iconClassName={compact ? "size-4" : "size-6"}
          onClick={() => onChange(!enabled)}
        />
      </span>
    </Tooltip>
  );
}
