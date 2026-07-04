import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { createPortal } from "react-dom";
import { Combobox } from "@headlessui/react";
import { cn } from "@operoz/utils";
import { ISSUE_DROPDOWN_PORTAL_Z_CLASS } from "@/components/dropdowns/popper-config";

type Props = {
  panelClassName?: string;
  popperElementRef: (element: HTMLDivElement | null) => void;
  popperStyles: CSSProperties;
  popperAttributes: HTMLAttributes<HTMLDivElement>;
  children: ReactNode;
};

export function ComboboxPortalOptions(props: Props) {
  const { panelClassName, popperElementRef, popperStyles, popperAttributes, children } = props;

  if (typeof document === "undefined") return null;

  return createPortal(
    <Combobox.Options className={cn("fixed", ISSUE_DROPDOWN_PORTAL_Z_CLASS)} data-prevent-outside-click static>
      <div
        className={cn(
          "my-1 w-48 rounded-sm border-[0.5px] border-strong bg-surface-1 px-2 py-2.5 text-11 shadow-raised-200 focus:outline-none",
          panelClassName
        )}
        ref={popperElementRef}
        style={popperStyles}
        {...popperAttributes}
      >
        {children}
      </div>
    </Combobox.Options>,
    document.body
  );
}
