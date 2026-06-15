import * as React from "react";
import { cn } from "../utils";
import { OAuthButton } from "./oauth-button";

export type TOAuthOption = {
  id: string;
  text: string;
  icon: React.ReactNode;
  onClick: () => void;
  enabled?: boolean;
};

type OAuthOptionsProps = {
  options: TOAuthOption[];
  compact?: boolean;
  showDivider?: boolean;
  className?: string;
  containerClassName?: string;
};

export function OAuthOptions(props: OAuthOptionsProps) {
  const { options, compact = false, showDivider = true, className = "", containerClassName = "" } = props;

  // Filter enabled options
  const enabledOptions = options.filter((option) => option.enabled !== false);

  if (enabledOptions.length === 0) return null;

  return (
    <div className={cn("w-full", containerClassName)}>
      <div
        className={cn(
          "flex gap-4 overflow-hidden transition-all duration-500 ease-in-out",
          compact ? "flex-row" : "flex-col",
          className
        )}
      >
        {enabledOptions.map((option) => (
          <OAuthButton
            key={option.id}
            text={option.text}
            icon={option.icon}
            onClick={option.onClick}
            compact={compact}
            className="transition-all duration-300 ease-in-out"
          />
        ))}
      </div>

      {showDivider && (
        <div className="mt-7 flex items-center gap-4">
          <hr className="min-h-px min-w-0 flex-1 border-0 border-t border-white/[0.08] dark:border-white/[0.06]" />
          <p className="flex-shrink-0 text-11 font-medium tracking-[0.18em] text-tertiary/80 uppercase">ou</p>
          <hr className="min-h-px min-w-0 flex-1 border-0 border-t border-white/[0.08] dark:border-white/[0.06]" />
        </div>
      )}
    </div>
  );
}
