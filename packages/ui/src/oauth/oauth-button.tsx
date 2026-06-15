import * as React from "react";
import { cn } from "../utils";

export interface OAuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  icon: React.ReactNode;
  compact?: boolean;
}

const OAuthButton = React.forwardRef(function OAuthButton(
  props: OAuthButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  const { text, icon, compact = false, className = "", ...rest } = props;

  return (
    <button
      ref={ref}
      className={cn(
        "hover:shadow-md flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-white/[0.08] bg-layer-1/60 px-4 py-2.5 text-13 font-medium text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm transition-all duration-200 hover:border-white/[0.14] hover:bg-layer-2/80 active:scale-[0.98] dark:border-white/[0.06]",
        className
      )}
      {...rest}
    >
      <div className="flex flex-shrink-0 items-center justify-center">{icon}</div>
      {!compact && (
        <span className="flex flex-grow items-center justify-center text-body-sm-regular transition-opacity duration-300">
          {text}
        </span>
      )}
    </button>
  );
});

OAuthButton.displayName = "plane-ui-oauth-button";

export { OAuthButton };
