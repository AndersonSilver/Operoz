import React, { Fragment, useState } from "react";
import type { Placement } from "@popperjs/core";
import { usePopper } from "react-popper";
// headless ui
import { Popover, Transition } from "@headlessui/react";
// ui
import { Button } from "@operis/propel/button";

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
  } = props;

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | HTMLDivElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "auto",
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
                  variant="secondary"
                  prependIcon={icon}
                  tabIndex={tabIndex}
                  className="relative hidden @4xl:inline-flex"
                  size="lg"
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
                  variant="secondary"
                  tabIndex={tabIndex}
                  className="inline-flex @4xl:hidden"
                  size="lg"
                >
                  {miniIcon || title}
                </Button>
              </div>
            )}
          </Popover.Button>
          <Transition
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
              static
              ref={setPopperElement}
              style={styles.popper}
              {...attributes.popper}
              className="fixed z-50 my-1 w-[18.75rem] max-h-[min(30rem,70vh)] min-h-[8rem] overflow-hidden rounded-sm border border-subtle bg-surface-1 shadow-raised-100 lg:max-h-[min(37.5rem,70vh)]"
            >
              <div className="flex max-h-[inherit] min-h-[inherit] w-full flex-col">{children}</div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
}
