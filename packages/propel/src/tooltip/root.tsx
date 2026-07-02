import * as React from "react";
import { Tooltip as BaseTooltip } from "@base-ui-components/react/tooltip";
import { cn } from "../utils";
import type { TPlacement, TSide, TAlign } from "../utils/placement";
import { convertPlacementToSideAndAlign } from "../utils/placement";

type ITooltipProps = {
  tooltipHeading?: string;
  tooltipContent?: string | React.ReactNode | null;
  position?: TPlacement;
  children: React.ReactElement;
  disabled?: boolean;
  className?: string;
  openDelay?: number;
  closeDelay?: number;
  isMobile?: boolean;
  renderByDefault?: boolean;
  side?: TSide;
  align?: TAlign;
  sideOffset?: number;
};

function mergeHandler<E extends React.SyntheticEvent>(
  parentHandler: React.EventHandler<E> | undefined,
  childHandler: React.EventHandler<E> | undefined
) {
  if (parentHandler && childHandler) {
    return (event: E) => {
      parentHandler(event);
      childHandler(event);
    };
  }
  return parentHandler ?? childHandler;
}

function composeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") {
        ref(node);
      } else if (typeof ref === "object") {
        (ref as React.MutableRefObject<T | null>).current = node;
      }
    }
  };
}

export const Tooltip = React.forwardRef<HTMLElement, ITooltipProps>(function Tooltip(props, forwardedRef) {
  const {
    tooltipHeading,
    tooltipContent,
    position = "top",
    children,
    disabled = false,
    className = "",
    openDelay = 200,
    side = "bottom",
    align = "center",
    sideOffset = 10,
    closeDelay,
    isMobile = false,
  } = props;
  const { finalSide, finalAlign } = React.useMemo(() => {
    if (position) {
      const converted = convertPlacementToSideAndAlign(position);
      return { finalSide: converted.side, finalAlign: converted.align };
    }
    return { finalSide: side, finalAlign: align };
  }, [position, side, align]);

  const triggerChild = React.isValidElement(children)
    ? React.cloneElement(children, {
        ref: composeRefs(forwardedRef, (children as { ref?: React.Ref<HTMLElement> }).ref),
        onClick: mergeHandler(
          (props as React.HTMLAttributes<HTMLElement>).onClick,
          (children.props as React.HTMLAttributes<HTMLElement>).onClick
        ),
        onMouseDown: mergeHandler(
          (props as React.HTMLAttributes<HTMLElement>).onMouseDown,
          (children.props as React.HTMLAttributes<HTMLElement>).onMouseDown
        ),
        onPointerDown: mergeHandler(
          (props as React.HTMLAttributes<HTMLElement>).onPointerDown,
          (children.props as React.HTMLAttributes<HTMLElement>).onPointerDown
        ),
        onKeyDown: mergeHandler(
          (props as React.HTMLAttributes<HTMLElement>).onKeyDown,
          (children.props as React.HTMLAttributes<HTMLElement>).onKeyDown
        ),
      } as React.HTMLAttributes<HTMLElement>)
    : children;

  return (
    <BaseTooltip.Provider>
      <BaseTooltip.Root delay={openDelay} closeDelay={closeDelay} disabled={disabled}>
        <BaseTooltip.Trigger render={triggerChild} />
        <BaseTooltip.Portal>
          <BaseTooltip.Positioner
            className={cn(
              "z-50 max-w-xs gap-1 overflow-hidden rounded-lg border border-subtle-1 bg-layer-2 px-2 py-1.5 break-words shadow-overlay-200",
              {
                hidden: isMobile,
              },
              className
            )}
            side={finalSide}
            sideOffset={sideOffset}
            align={finalAlign}
            render={
              <BaseTooltip.Popup>
                {/* Use div (not p): tooltipContent is ReactNode and often includes <p>, <div>, or lists — p cannot nest p/block. */}
                {tooltipHeading && <div className="text-caption-md-medium text-primary">{tooltipHeading}</div>}
                {tooltipContent && (
                  <div
                    className={cn("text-caption-sm-regular text-secondary", {
                      "mt-1": tooltipHeading && tooltipHeading !== "",
                    })}
                  >
                    {tooltipContent}
                  </div>
                )}
              </BaseTooltip.Popup>
            }
          />
        </BaseTooltip.Portal>
      </BaseTooltip.Root>
    </BaseTooltip.Provider>
  );
});

Tooltip.displayName = "Tooltip";
