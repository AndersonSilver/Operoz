import React from "react";
// helpers
import { getButtonStyling } from "@operoz/propel/button";
import { Tooltip } from "@operoz/propel/tooltip";
import { cn } from "@operoz/utils";
// types
import { usePlatformOS } from "@/hooks/use-platform-os";
import { BACKGROUND_BUTTON_VARIANTS, BORDER_BUTTON_VARIANTS } from "./constants";
import type { TButtonVariants } from "./types";

type DropdownButtonSurfaceProps = {
  children: React.ReactNode;
  className?: string;
  isActive?: boolean;
};

const DropdownButtonSurface = React.forwardRef<HTMLSpanElement, DropdownButtonSurfaceProps>(
  function DropdownButtonSurface(props, ref) {
    const { children, className, isActive } = props;

    return (
      <span
        ref={ref}
        className={cn(
          getButtonStyling("ghost", "sm"),
          "flex h-full w-full items-center justify-start gap-1.5",
          className,
          isActive && "bg-layer-transparent-active"
        )}
      >
        {children}
      </span>
    );
  }
);

DropdownButtonSurface.displayName = "DropdownButtonSurface";

export type DropdownButtonProps = {
  children: React.ReactNode;
  className?: string;
  isActive: boolean;
  tooltipContent?: string | React.ReactNode | null;
  tooltipHeading: string;
  showTooltip: boolean;
  variant: TButtonVariants;
  renderToolTipByDefault?: boolean;
};

type ButtonProps = {
  children: React.ReactNode;
  className?: string;
  isActive: boolean;
  tooltipContent?: string | React.ReactNode | null;
  tooltipHeading: string;
  showTooltip: boolean;
  renderToolTipByDefault?: boolean;
};

export function DropdownButton(props: DropdownButtonProps) {
  const {
    children,
    className,
    isActive,
    tooltipContent,
    renderToolTipByDefault = true,
    tooltipHeading,
    showTooltip,
    variant,
  } = props;
  const ButtonToRender: React.FC<ButtonProps> = BORDER_BUTTON_VARIANTS.includes(variant)
    ? BorderButton
    : BACKGROUND_BUTTON_VARIANTS.includes(variant)
      ? BackgroundButton
      : TransparentButton;

  return (
    <ButtonToRender
      className={className}
      isActive={isActive}
      tooltipContent={tooltipContent}
      tooltipHeading={tooltipHeading}
      showTooltip={showTooltip}
      renderToolTipByDefault={renderToolTipByDefault}
    >
      {children}
    </ButtonToRender>
  );
}

function BorderButton(props: ButtonProps) {
  const { children, className, isActive, tooltipContent, renderToolTipByDefault, tooltipHeading, showTooltip } = props;
  const { isMobile } = usePlatformOS();

  return (
    <Tooltip
      tooltipHeading={tooltipHeading}
      tooltipContent={<>{tooltipContent}</>}
      disabled={!showTooltip}
      isMobile={isMobile}
      renderByDefault={renderToolTipByDefault}
    >
      <DropdownButtonSurface isActive={isActive} className={cn("border-[0.5px] border-strong", className)}>
        {children}
      </DropdownButtonSurface>
    </Tooltip>
  );
}

function BackgroundButton(props: ButtonProps) {
  const { children, className, tooltipContent, tooltipHeading, renderToolTipByDefault, showTooltip } = props;
  const { isMobile } = usePlatformOS();
  return (
    <Tooltip
      tooltipHeading={tooltipHeading}
      tooltipContent={<>{tooltipContent}</>}
      disabled={!showTooltip}
      isMobile={isMobile}
      renderByDefault={renderToolTipByDefault}
    >
      <DropdownButtonSurface
        className={cn("items-center justify-between bg-layer-3 hover:bg-layer-1-hover", className)}
      >
        {children}
      </DropdownButtonSurface>
    </Tooltip>
  );
}

function TransparentButton(props: ButtonProps) {
  const { children, className, isActive, tooltipContent, tooltipHeading, renderToolTipByDefault, showTooltip } = props;
  const { isMobile } = usePlatformOS();
  return (
    <Tooltip
      tooltipHeading={tooltipHeading}
      tooltipContent={<>{tooltipContent}</>}
      disabled={!showTooltip}
      isMobile={isMobile}
      renderByDefault={renderToolTipByDefault}
    >
      <DropdownButtonSurface isActive={isActive} className={cn("items-center justify-between", className)}>
        {children}
      </DropdownButtonSurface>
    </Tooltip>
  );
}
