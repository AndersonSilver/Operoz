import { useCallback, useState } from "react";
import { GitCompareArrows } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { IconButton } from "@operis/propel/icon-button";
import { Tooltip } from "@operis/propel/tooltip";
import { cn } from "@operis/utils";

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
};

export function Client360PeriodCompareToggle({ enabled, onChange, available = true, className }: ToggleProps) {
  const { t } = useTranslation();

  if (!available) return null;

  const label = t("boards.client_360.period_compare_label");

  return (
    <Tooltip tooltipContent={label}>
      <span className={cn("inline-flex", className)}>
        <IconButton
          variant={enabled ? "primary" : "secondary"}
          size="xl"
          icon={GitCompareArrows}
          aria-label={label}
          aria-pressed={enabled}
          className="shrink-0 rounded-sm"
          onClick={() => onChange(!enabled)}
        />
      </span>
    </Tooltip>
  );
}
