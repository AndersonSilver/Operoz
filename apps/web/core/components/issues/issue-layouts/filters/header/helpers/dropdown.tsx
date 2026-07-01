import React, { Fragment, useState } from "react";
import ReactDOM from "react-dom";
import type { Placement } from "@popperjs/core";
import { usePopper } from "react-popper";
// headless ui
import { Popover, Transition } from "@headlessui/react";
// ui
import { Button } from "@operoz/propel/button";
import { cn } from "@operoz/utils";
import { PROJECT_HUB_TOOLBAR_BUTTON_CLASS } from "@/components/project/project-hub-toolbar";

type Props = {
  children: React.ReactNode;
  icon?: React.ReactElement;
  miniIcon?: React.ReactNode;
  title?: string;
  placement?: Placement;
  disabled?: boolean;
  tabIndex?: number;
  menuButton?: React.ReactNode;
  isFiltersApplied?: boolean;
  /** `hub` — botão compacto para barras de ferramentas do projeto (wallpaper / vidro). */
  appearance?: "default" | "hub";
};

export function FiltersDropdown(props: Props) {
  const {
    children,
    miniIcon,
    icon,
    title = "Dropdown",
    placement,
    disabled = false,
    tabIndex,
    menuButton,
    isFiltersApplied = false,
    appearance = "default",
  } = props;

  const isHub = appearance === "hub";
  const hubButtonClassName = cn("relative", PROJECT_HUB_TOOLBAR_BUTTON_CLASS);

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | HTMLDivElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "bottom-end",
    strategy: "fixed",
    modifiers: [
      { name: "offset", options: { offset: [0, 4] } },
      { name: "preventOverflow", options: { padding: 8 } },
      {
        name: "flip",
        options: { fallbackPlacements: ["top-end", "top-start", "bottom-start", "bottom-end"] },
      },
    ],
  });

  return (
    <Popover as="div">
      {({ open }) => (
        <>
          <Popover.Button as={React.Fragment}>
            {menuButton ? (
              <button type="button" ref={setReferenceElement}>
                {menuButton}
              </button>
            ) : (
              <div ref={setReferenceElement} className="inline-flex shrink-0">
                <Button
                  disabled={disabled}
                  variant={isHub ? "ghost" : "secondary"}
                  prependIcon={icon}
                  tabIndex={tabIndex}
                  className={cn("relative hidden @4xl:inline-flex", isHub && hubButtonClassName)}
                  size={isHub ? "sm" : "lg"}
                >
                  <>
                    <div className={`${open ? "text-primary" : "text-secondary"}`}>
                      <span>{title}</span>
                    </div>
                    {isFiltersApplied && (
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent-primary" />
                    )}
                  </>
                </Button>
                <Button
                  disabled={disabled}
                  variant={isHub ? "ghost" : "secondary"}
                  tabIndex={tabIndex}
                  className={cn("inline-flex @4xl:hidden", isHub && "h-8 w-8 border border-subtle/50 p-0")}
                  size={isHub ? "sm" : "lg"}
                >
                  {miniIcon || title}
                </Button>
              </div>
            )}
          </Popover.Button>
          {open &&
            typeof document !== "undefined" &&
            ReactDOM.createPortal(
              <Transition
                show={open}
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                {/** translate-y-0 is a hack to create new stacking context. Required for safari  */}
                <Popover.Panel
                  ref={setPopperElement}
                  style={styles.popper}
                  {...attributes.popper}
                  className="fixed z-[100] my-1 max-h-[min(30rem,70vh)] min-h-[8rem] w-[18.75rem] overflow-hidden rounded-sm border border-subtle bg-surface-1 shadow-raised-100 lg:max-h-[min(37.5rem,70vh)]"
                >
                  <div className="flex max-h-[inherit] min-h-[inherit] w-full flex-col">{children}</div>
                </Popover.Panel>
              </Transition>,
              document.body
            )}
        </>
      )}
    </Popover>
  );
}
