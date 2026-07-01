import { Fragment, useEffect, useState, type ReactNode } from "react";
import ReactDOM from "react-dom";
import { Menu, Transition } from "@headlessui/react";
import { usePopper } from "react-popper";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@operoz/utils";
import { useAppTheme } from "@/hooks/store/use-app-theme";

export type TSidebarQuickMenuItem = {
  key: string;
  label: ReactNode;
  onClick: () => void;
  shouldRender?: boolean;
  disabled?: boolean;
};

type SidebarRowQuickMenuProps = {
  items: TSidebarQuickMenuItem[];
  ariaLabel: string;
  className?: string;
  buttonClassName?: string;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
};

function SidebarQuickMenuDropdownSync({ open, children }: { open: boolean; children: ReactNode }) {
  const { toggleAnySidebarDropdown } = useAppTheme();

  useEffect(() => {
    toggleAnySidebarDropdown(open);
  }, [open, toggleAnySidebarDropdown]);

  return <>{children}</>;
}

type SidebarQuickMenuPanelProps = {
  open: boolean;
  close: () => void;
  items: TSidebarQuickMenuItem[];
  referenceElement: HTMLButtonElement | null;
};

function SidebarQuickMenuPanel(props: SidebarQuickMenuPanelProps) {
  const { open, close, items, referenceElement } = props;
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-end",
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

  if (!open || typeof document === "undefined") return null;

  return ReactDOM.createPortal(
    <Transition
      show={open}
      as={Fragment}
      enter="transition ease-out duration-100"
      enterFrom="opacity-0 scale-95"
      enterTo="opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="opacity-100 scale-100"
      leaveTo="opacity-0 scale-95"
    >
      <Menu.Items
        static
        as="div"
        ref={setPopperElement}
        style={styles.popper}
        {...attributes.popper}
        data-prevent-outside-click="true"
        className="fixed z-[300] focus:outline-none"
      >
        <div className="flex w-max max-w-[16rem] min-w-[10rem] flex-col rounded-md border-[0.5px] border-subtle-1 bg-surface-1 p-1 text-11 shadow-raised-200">
          {items.map((item) => (
            <Menu.Item key={item.key} disabled={item.disabled}>
              {({ active, disabled }) => (
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-secondary outline-none",
                    {
                      "bg-layer-transparent-hover text-primary": active && !disabled,
                      "cursor-not-allowed text-placeholder": disabled,
                    }
                  )}
                  disabled={disabled}
                  onClick={() => {
                    if (disabled) return;
                    item.onClick();
                    close();
                  }}
                >
                  {item.label}
                </button>
              )}
            </Menu.Item>
          ))}
        </div>
      </Menu.Items>
    </Transition>,
    document.body
  );
}

function SidebarQuickMenuOpenSync({ open, onOpenChange }: { open: boolean; onOpenChange?: (open: boolean) => void }) {
  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  return null;
}

export function SidebarRowQuickMenu(props: SidebarRowQuickMenuProps) {
  const { items, ariaLabel, className, buttonClassName, onOpenChange, trigger } = props;
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);

  const visibleItems = items.filter((item) => item.shouldRender !== false);

  if (visibleItems.length === 0) return null;

  return (
    <Menu as="div" className={cn("relative shrink-0", className)}>
      {({ open, close }) => (
        <SidebarQuickMenuDropdownSync open={open}>
          <>
            <SidebarQuickMenuOpenSync open={open} onOpenChange={onOpenChange} />
            <Menu.Button
              ref={setReferenceElement}
              type="button"
              className={cn(
                "grid size-6 place-items-center rounded-sm text-placeholder outline-none hover:bg-layer-transparent-hover",
                buttonClassName
              )}
              aria-label={ariaLabel}
            >
              {trigger ?? <MoreHorizontal className="size-3.5 shrink-0" aria-hidden />}
            </Menu.Button>
            <SidebarQuickMenuPanel open={open} close={close} items={visibleItems} referenceElement={referenceElement} />
          </>
        </SidebarQuickMenuDropdownSync>
      )}
    </Menu>
  );
}
