import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { cn } from "@operoz/utils";

type AuthThemeToggleProps = {
  className?: string;
};

export function AuthThemeToggle({ className }: AuthThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className={cn("fixed top-5 right-5 z-[100] size-9 sm:top-6 sm:right-8", className)} aria-hidden />;
  }

  const isDark = resolvedTheme === "dark" || resolvedTheme === "dark-contrast";
  const label = isDark ? t("auth.common.theme.switch_to_light") : t("auth.common.theme.switch_to_dark");

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "shadow-xs fixed top-5 right-5 z-[100] inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-subtle bg-layer-2/70 text-tertiary backdrop-blur-sm transition-colors sm:top-6 sm:right-8",
        "hover:border-strong hover:bg-layer-1-hover hover:text-primary",
        "focus-visible:ring-accent-primary focus-visible:ring-offset-surface-1 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        className
      )}
      aria-label={label}
      title={label}
    >
      {isDark ? <Sun className="size-4" strokeWidth={1.75} /> : <Moon className="size-4" strokeWidth={1.75} />}
    </button>
  );
}
