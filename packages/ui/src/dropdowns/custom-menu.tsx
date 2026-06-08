import { Popover, Transition } from "@headlessui/react";
import { MoreHorizontal } from "lucide-react";
import * as React from "react";
import ReactDOM from "react-dom";
import { usePopper } from "react-popper";
import { ChevronDownIcon, ChevronRightIcon } from "@operis/propel/icons";
// plane helpers
// helpers
import { cn } from "../utils";
// hooks
// types
import type {
  ICustomMenuDropdownProps,
  ICustomMenuItemProps,
  ICustomSubMenuProps,
  ICustomSubMenuTriggerProps,
  ICustomSubMenuContentProps,
} from "./helper";

interface PortalProps {
  children: React.ReactNode;
  container?: Element | null;
  asChild?: boolean;
}

function Portal({ children, container, asChild = false }: PortalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return null;
  }

  const targetContainer = container || document.body;

  if (asChild) {
    return ReactDOM.createPortal(children, targetContainer);
  }

  return ReactDOM.createPortal(<div data-radix-portal="">{children}</div>, targetContainer);
}

// Context for main menu to communicate with submenus
const MenuContext = React.createContext<{
  closeAllSubmenus: () => void;
  registerSubmenu: (closeSubmenu: () => void) => () => void;
} | null>(null);

const CloseMenuContext = React.createContext<(() => void) | null>(null);

function shouldWrapCustomButtonTrigger(element: React.ReactElement): boolean {
  if (typeof element.type === "string") {
    return element.type !== "button" && element.type !== "a";
  }

  const displayName = (element.type as { displayName?: string })?.displayName ?? "";
  // Only skip wrap for components that forward Popover.Button props (onClick, ref) to a native button.
  if (displayName === "plane-ui-icon-button" || displayName === "plane-ui-button") {
    return false;
  }

  return true;
}

function CustomMenuOpenSync(props: { open: boolean; onOpen?: () => void }) {
  const { open, onOpen } = props;
  const wasOpen = React.useRef(false);

  React.useEffect(() => {
    if (open && !wasOpen.current) onOpen?.();
    wasOpen.current = open;
  }, [open, onOpen]);

  return null;
}

function CustomMenu(props: ICustomMenuDropdownProps) {
  const {
    ariaLabel,
    buttonClassName = "",
    customButtonClassName = "",
    customButtonTabIndex = 0,
    placement,
    children,
    className = "",
    customButton,
    disabled = false,
    ellipsis = false,
    label,
    maxHeight = "md",
    noBorder = false,
    noChevron = false,
    optionsClassName = "",
    menuItemsClassName = "",
    verticalEllipsis = false,
    portalElement,
    menuButtonOnClick,
    onMenuClose,
    tabIndex,
    closeOnSelect: _closeOnSelect,
    openOnHover: _openOnHover = false,
    useCaptureForOutsideClick: _useCaptureForOutsideClick = false,
  } = props;

  const [referenceElement, setReferenceElement] = React.useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = React.useState<HTMLDivElement | null>(null);
  const submenuClosersRef = React.useRef<Set<() => void>>(new Set());

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "bottom-end",
    strategy: "fixed",
    modifiers: [
      { name: "offset", options: { offset: [0, 4] } },
      { name: "preventOverflow", options: { padding: 8, boundary: "viewport", rootBoundary: "viewport" } },
      {
        name: "flip",
        options: { fallbackPlacements: ["top-end", "top-start", "bottom-start", "bottom-end"] },
      },
    ],
  });

  const closeAllSubmenus = React.useCallback(() => {
    submenuClosersRef.current.forEach((closeSubmenu) => closeSubmenu());
  }, []);

  const registerSubmenu = React.useCallback((closeSubmenu: () => void) => {
    submenuClosersRef.current.add(closeSubmenu);
    return () => {
      submenuClosersRef.current.delete(closeSubmenu);
    };
  }, []);

  const assignReferenceElement = React.useCallback(
    (node: HTMLButtonElement | null) => {
      setReferenceElement(node);
      if (!React.isValidElement(customButton)) return;
      const childRef = (customButton as React.ReactElement & { ref?: React.Ref<HTMLButtonElement> }).ref;
      if (typeof childRef === "function") childRef(node);
      else if (childRef && typeof childRef === "object") {
        (childRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      }
    },
    [customButton]
  );

  const renderTriggerButton = (content: React.ReactNode) => (
    <button
      ref={setReferenceElement}
      type="button"
      className={cn(
        "inline-flex cursor-pointer border-0 bg-transparent p-0 text-inherit",
        customButtonClassName
      )}
      tabIndex={customButtonTabIndex}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {content}
    </button>
  );

  const renderCustomButton = () => {
    if (!React.isValidElement(customButton)) {
      return renderTriggerButton(customButton);
    }

    const customButtonElement = customButton as React.ReactElement<{
      className?: string;
      disabled?: boolean;
      "aria-label"?: string;
      variant?: string;
    }>;

    if (shouldWrapCustomButtonTrigger(customButtonElement)) {
      return renderTriggerButton(customButton);
    }

    return React.cloneElement(customButtonElement, {
      ref: assignReferenceElement,
      disabled: disabled || customButtonElement.props.disabled,
      "aria-label": ariaLabel ?? customButtonElement.props["aria-label"],
      tabIndex: customButtonTabIndex,
      className: cn(customButtonClassName, customButtonElement.props.className),
    });
  };

  const portalTarget =
    portalElement ?? (typeof document !== "undefined" ? document.body : null);

  const handleClose = React.useCallback(() => {
    closeAllSubmenus();
    onMenuClose?.();
  }, [closeAllSubmenus, onMenuClose]);

  return (
    <Popover
      as="div"
      tabIndex={tabIndex}
      className={cn("relative w-min text-left", className)}
      data-main-menu="true"
    >
      {({ open, close }) => {
        const closeMenu = () => {
          handleClose();
          close();
        };

        const panel = (
          <Transition
            show={open}
            as={React.Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel
              static
              data-prevent-outside-click="true"
              className={cn("fixed z-[100] w-max max-w-[16rem] translate-y-0 focus:outline-none", menuItemsClassName)}
              ref={setPopperElement}
              style={{ ...styles.popper, width: "max-content" }}
              {...attributes.popper}
            >
              <div
                className={cn(
                  "my-1 flex w-fit min-w-[10rem] flex-col overflow-y-auto rounded-md border-[0.5px] border-subtle-1 bg-surface-1 px-2 py-2.5 text-11 whitespace-nowrap",
                  {
                    "max-h-96": maxHeight === "2xl",
                    "max-h-80": maxHeight === "xl",
                    "max-h-60": maxHeight === "lg",
                    "max-h-48": maxHeight === "md",
                    "max-h-36": maxHeight === "rg",
                    "max-h-28": maxHeight === "sm",
                  },
                  optionsClassName
                )}
              >
                <CloseMenuContext.Provider value={closeMenu}>
                  <MenuContext.Provider value={{ closeAllSubmenus, registerSubmenu }}>
                    {children}
                  </MenuContext.Provider>
                </CloseMenuContext.Provider>
              </div>
            </Popover.Panel>
          </Transition>
        );

        return (
          <>
            <CustomMenuOpenSync open={open} onOpen={menuButtonOnClick} />
            <Popover.Button as={React.Fragment}>
              {customButton ? (
                renderCustomButton()
              ) : ellipsis || verticalEllipsis ? (
                <button
                  ref={setReferenceElement}
                  type="button"
                  disabled={disabled}
                  className={`relative grid place-items-center rounded-sm p-1 text-secondary outline-none hover:text-primary ${
                    disabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-layer-transparent-hover"
                  } ${buttonClassName}`}
                  tabIndex={customButtonTabIndex}
                  aria-label={ariaLabel}
                >
                  <MoreHorizontal className={`h-3.5 w-3.5 ${verticalEllipsis ? "rotate-90" : ""}`} />
                </button>
              ) : (
                <button
                  ref={setReferenceElement}
                  type="button"
                  className={`flex items-center justify-between gap-1 rounded-md px-2.5 py-1 text-11 whitespace-nowrap duration-300 ${
                    open ? "text-primary" : "text-secondary"
                  } ${noBorder ? "" : "shadow-sm border border-strong focus:outline-none"} ${
                    disabled ? "cursor-not-allowed text-secondary" : "cursor-pointer hover:bg-layer-transparent-hover"
                  } ${buttonClassName}`}
                  tabIndex={customButtonTabIndex}
                  disabled={disabled}
                  aria-label={ariaLabel}
                >
                  {label}
                  {!noChevron && <ChevronDownIcon className="h-3.5 w-3.5" />}
                </button>
              )}
            </Popover.Button>
            {open && portalTarget ? ReactDOM.createPortal(panel, portalTarget) : null}
          </>
        );
      }}
    </Popover>
  );
}

// SubMenu context for closing submenu from nested items
const SubMenuContext = React.createContext<{ closeSubmenu: () => void } | null>(null);

// Hook to use submenu context
const useSubMenu = () => React.useContext(SubMenuContext);

// SubMenu implementation
function SubMenu(props: ICustomSubMenuProps) {
  const {
    children,
    trigger,
    disabled = false,
    className = "",
    contentClassName = "",
    placement = "right-start",
  } = props;

  const [isOpen, setIsOpen] = React.useState(false);
  const [referenceElement, setReferenceElement] = React.useState<HTMLSpanElement | null>(null);
  const [popperElement, setPopperElement] = React.useState<HTMLDivElement | null>(null);
  const submenuRef = React.useRef<HTMLDivElement | null>(null);

  const menuContext = React.useContext(MenuContext);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement,
    strategy: "fixed", // Use fixed positioning to escape overflow constraints
    modifiers: [
      {
        name: "offset",
        options: {
          offset: [0, 4],
        },
      },
      {
        name: "flip",
        options: {
          fallbackPlacements: ["left-start", "right-end", "left-end", "top-start", "bottom-start"],
        },
      },
      {
        name: "preventOverflow",
        options: {
          padding: 8,
        },
      },
    ],
  });

  const closeSubmenu = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  // Register this submenu with the main menu context
  React.useEffect(() => {
    if (menuContext) {
      return menuContext.registerSubmenu(closeSubmenu);
    }
  }, [menuContext, closeSubmenu]);

  const toggleSubmenu = () => {
    if (!disabled) {
      // Close other submenus when opening this one
      if (!isOpen && menuContext) {
        menuContext.closeAllSubmenus();
      }
      setIsOpen(!isOpen);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSubmenu();
  };

  // Close submenu when clicking on other menu items
  React.useEffect(() => {
    const handleMenuItemClick = (e: Event) => {
      const target = e.target as HTMLElement;
      // Check if the click is on a menu item that's not part of this submenu
      if (target.closest('[role="menuitem"]') && !submenuRef.current?.contains(target)) {
        closeSubmenu();
      }
    };

    document.addEventListener("click", handleMenuItemClick);
    return () => {
      document.removeEventListener("click", handleMenuItemClick);
    };
  }, [closeSubmenu]);

  return (
    <div ref={submenuRef} className={cn("relative", className)}>
      <span ref={setReferenceElement} className="w-full">
        <button
          type="button"
          role="menuitem"
          disabled={disabled}
          className={cn(
            "flex w-full cursor-pointer items-center justify-between rounded-sm px-1 py-1.5 text-left text-secondary select-none hover:bg-layer-transparent-hover",
            {
              "text-placeholder": disabled,
              "cursor-not-allowed": disabled,
            }
          )}
          onClick={handleClick}
        >
          <span className="flex-1">{trigger}</span>
          <ChevronRightIcon className="h-3.5 w-3.5 flex-shrink-0" />
        </button>
      </span>

      {isOpen && (
        <Portal>
          <div
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
            className={cn(
              "fixed z-[110] min-w-[12rem] overflow-hidden rounded-md border-[0.5px] border-subtle-1 bg-surface-1 p-1 text-11",
              contentClassName
            )}
            data-prevent-outside-click="true"
            onMouseEnter={() => {
              // Notify parent menu that we're hovering over submenu
              const mainMenuElement = document.querySelector('[data-main-menu="true"]');
              if (mainMenuElement) {
                const mouseEnterEvent = new MouseEvent("mouseenter", { bubbles: true });
                mainMenuElement.dispatchEvent(mouseEnterEvent);
              }
            }}
            onMouseLeave={() => {
              // Notify parent menu that we're leaving submenu
              const mainMenuElement = document.querySelector('[data-main-menu="true"]');
              if (mainMenuElement) {
                const mouseLeaveEvent = new MouseEvent("mouseleave", { bubbles: true });
                mainMenuElement.dispatchEvent(mouseLeaveEvent);
              }
            }}
          >
            <SubMenuContext.Provider value={{ closeSubmenu }}>{children}</SubMenuContext.Provider>
          </div>
        </Portal>
      )}
    </div>
  );
}

function MenuItem(props: ICustomMenuItemProps) {
  const { children, disabled = false, onClick, className } = props;
  const submenuContext = useSubMenu();
  const closeMenu = React.useContext(CloseMenuContext);

  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        "w-full truncate rounded-sm px-1 py-1.5 text-left text-secondary select-none hover:bg-layer-transparent-hover",
        {
          "text-placeholder": disabled,
        },
        className
      )}
      onClick={(e) => {
        onClick?.(e);
        if (!disabled) {
          closeMenu?.();
          submenuContext?.closeSubmenu();
        }
      }}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function SubMenuTrigger(props: ICustomSubMenuTriggerProps) {
  const { children, disabled = false, className } = props;

  return (
    <div
      role="menuitem"
      className={cn(
        "flex w-full items-center justify-between rounded-sm px-1 py-1.5 text-left text-secondary select-none",
        {
          "text-placeholder": disabled,
          "cursor-pointer hover:bg-layer-transparent-hover": !disabled,
          "cursor-not-allowed": disabled,
        },
        className
      )}
    >
      <span className="flex-1">{children}</span>
      <ChevronRightIcon className="h-3.5 w-3.5 flex-shrink-0" />
    </div>
  );
}

function SubMenuContent(props: ICustomSubMenuContentProps) {
  const { children, className } = props;

  return (
    <div
      className={cn(
        "z-[15] min-w-[12rem] overflow-hidden rounded-md border border-subtle-1 bg-surface-1 p-1 text-11",
        className
      )}
    >
      {children}
    </div>
  );
}

// Add all components as static properties for external use
CustomMenu.Portal = Portal;
CustomMenu.MenuItem = MenuItem;
CustomMenu.SubMenu = SubMenu;
CustomMenu.SubMenuTrigger = SubMenuTrigger;
CustomMenu.SubMenuContent = SubMenuContent;

export { CustomMenu };
