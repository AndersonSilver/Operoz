import type { ReactNode } from "react";
import { Logo } from "@operoz/propel/emoji-icon-picker";
import type { TLogoProps } from "@operoz/types";
import { cn } from "@operoz/utils";

type Props = {
  logo?: TLogoProps | null;
  fallback?: ReactNode;
  size?: number;
  className?: string;
};

export function hasConfiguredLogo(logo?: TLogoProps | null): boolean {
  if (!logo || !logo.in_use) return false;
  const key = logo.in_use;
  const value = logo[key as keyof TLogoProps];
  if (value == null) return false;
  if (typeof value === "object" && value !== null && "value" in value) {
    return Boolean((value as { value?: string }).value);
  }
  return Boolean(value);
}

export function BoardGanttRowIcon(props: Props) {
  const { logo, fallback, size = 16, className } = props;

  if (hasConfiguredLogo(logo)) {
    return (
      <span
        className={cn("grid shrink-0 place-items-center rounded border border-subtle/60 bg-layer-2", className)}
        style={{ width: size + 8, height: size + 8 }}
      >
        <Logo logo={logo!} size={size} />
      </span>
    );
  }

  if (fallback) return <span className={cn("shrink-0", className)}>{fallback}</span>;
  return null;
}
