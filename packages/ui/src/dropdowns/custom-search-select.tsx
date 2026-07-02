import { Combobox } from "@headlessui/react";
import { Info } from "lucide-react";
import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
import { useOutsideClickDetector } from "@operoz/hooks";
import { CheckIcon, SearchIcon, ChevronDownIcon } from "@operoz/propel/icons";
// plane imports
// local imports
import { Tooltip } from "@operoz/propel/tooltip";
import { useDropdownKeyDown } from "../hooks/use-dropdown-key-down";
import { cn } from "../utils";
import type { ICustomSearchSelectProps } from "./helper";
import {
  assignChildRef,
  mergeTriggerElementProps,
  resolveCustomButtonTrigger,
  unwrapCustomButtonElement,
} from "./custom-button-trigger";

export function CustomSearchSelect(props: ICustomSearchSelectProps) {
  const {
    customButtonClassName = "",
    buttonClassName = "",
    className = "",
    chevronClassName = "",
    customButton,
    placement,
    disabled = false,
    footerOption,
    input = false,
    label,
    maxHeight = "md",
    multiple = false,
    noChevron = false,
    onChange,
    options,
    onOpen,
    onClose,
    optionsClassName = "",
    value,
    tabIndex,
    noResultsMessage = "No matches found",
    searchPlaceholder = "Search",
    defaultOpen = false,
    appearance = "default",
  } = props;
  const isHubAppearance = appearance === "hub";
  const [query, setQuery] = useState("");

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "bottom-start",
  });

  const filteredOptions =
    query === "" ? options : options?.filter((option) => option.query.toLowerCase().includes(query.toLowerCase()));

  const comboboxProps: any = {
    value,
    onChange,
    disabled,
  };

  if (multiple) comboboxProps.multiple = true;

  const openDropdown = () => {
    setIsOpen(true);
    if (referenceElement) referenceElement.focus();
    if (onOpen) onOpen();
  };

  const closeDropdown = () => {
    setIsOpen(false);
    onClose && onClose();
  };

  const handleKeyDown = useDropdownKeyDown(openDropdown, closeDropdown, isOpen);
  useOutsideClickDetector(dropdownRef, closeDropdown);

  const toggleDropdown = () => {
    if (isOpen) closeDropdown();
    else openDropdown();
  };

  const assignReferenceElement = (node: HTMLButtonElement | null) => {
    setReferenceElement(node);
    assignChildRef(node, customButton);
  };

  const renderTriggerButton = (content: React.ReactNode) => (
    <button
      ref={assignReferenceElement}
      type="button"
      className={cn(
        "flex w-auto max-w-none shrink-0 items-center justify-between gap-1 text-11",
        {
          "cursor-not-allowed text-secondary": disabled,
          "cursor-pointer hover:bg-layer-transparent-hover": !disabled,
        },
        customButtonClassName
      )}
      onClick={toggleDropdown}
      disabled={disabled}
    >
      {content}
    </button>
  );

  const renderCustomButton = () => {
    if (!customButton) return null;

    const resolved = resolveCustomButtonTrigger(customButton);

    if (resolved) {
      return React.cloneElement(
        resolved,
        mergeTriggerElementProps(resolved, {
          ref: assignReferenceElement,
          disabled,
          className: customButtonClassName,
          onClick: toggleDropdown,
        })
      );
    }

    if (!React.isValidElement(customButton)) {
      return renderTriggerButton(customButton);
    }

    return renderTriggerButton(unwrapCustomButtonElement(customButton) ?? customButton);
  };

  return (
    <Combobox
      as="div"
      ref={dropdownRef}
      tabIndex={tabIndex}
      className={cn("relative flex-shrink-0 text-left", className)}
      onKeyDown={handleKeyDown}
      {...comboboxProps}
    >
      {({ open }: { open: boolean }) => {
        if (open && onOpen) onOpen();

        return (
          <>
            {customButton ? (
              <Combobox.Button as={React.Fragment}>{renderCustomButton()}</Combobox.Button>
            ) : (
              <Combobox.Button as={React.Fragment}>
                <button
                  ref={setReferenceElement}
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between gap-1 rounded-sm border-[0.5px] border-strong",
                    {
                      "px-3 py-2 text-13": input,
                      "px-2 py-1 text-11": !input,
                      "cursor-not-allowed text-secondary": disabled,
                      "cursor-pointer hover:bg-layer-transparent-hover": !disabled,
                    },
                    buttonClassName
                  )}
                  onClick={toggleDropdown}
                >
                  {label}
                  {!noChevron && !disabled && (
                    <ChevronDownIcon className={cn("h-3 w-3 flex-shrink-0", chevronClassName)} aria-hidden="true" />
                  )}
                </button>
              </Combobox.Button>
            )}
            {isOpen &&
              createPortal(
                <Combobox.Options data-prevent-outside-click static>
                  <div
                    className={cn(
                      "z-30 my-1.5 overflow-y-auto whitespace-nowrap focus:outline-none",
                      isHubAppearance
                        ? "shadow-lg min-w-[min(100vw-2rem,20rem)] rounded-lg border border-subtle/50 bg-layer-1/95 py-2 text-13 backdrop-blur-xl"
                        : "min-w-48 rounded-md border-[0.5px] border-subtle-1 bg-surface-1 py-2.5 text-11",
                      optionsClassName
                    )}
                    ref={setPopperElement}
                    style={styles.popper}
                    {...attributes.popper}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-2 border border-subtle",
                        isHubAppearance
                          ? "mx-2 mb-1 h-9 rounded-md border-subtle/60 bg-layer-2/70 px-3"
                          : "mx-2 rounded-sm px-2"
                      )}
                    >
                      <SearchIcon
                        className={cn("shrink-0 text-placeholder", isHubAppearance ? "size-4" : "h-3.5 w-3.5")}
                        strokeWidth={1.5}
                      />
                      <Combobox.Input
                        className={cn(
                          "w-full bg-transparent text-secondary placeholder:text-placeholder focus:outline-none",
                          isHubAppearance ? "py-2 text-13" : "py-1 text-11"
                        )}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={searchPlaceholder}
                        displayValue={(assigned: any) => assigned?.name}
                      />
                    </div>
                    <div
                      className={cn("vertical-scrollbar scrollbar-xs overflow-y-scroll", {
                        "mt-2 space-y-1 px-2": !isHubAppearance,
                        "space-y-0.5 px-1.5": isHubAppearance,
                        "max-h-96": maxHeight === "2xl",
                        "max-h-80": maxHeight === "xl",
                        "max-h-60": maxHeight === "lg",
                        "max-h-48": maxHeight === "md",
                        "max-h-36": maxHeight === "rg",
                        "max-h-28": maxHeight === "sm",
                      })}
                    >
                      {filteredOptions ? (
                        filteredOptions.length > 0 ? (
                          filteredOptions.map((option) => (
                            <Combobox.Option
                              key={option.value}
                              value={option.value}
                              className={({ active, selected }) =>
                                cn(
                                  "flex w-full cursor-pointer items-center justify-between gap-2 truncate select-none",
                                  isHubAppearance ? "rounded-md px-2.5 py-2 text-13" : "rounded-sm px-1 py-1.5 text-11",
                                  {
                                    "bg-layer-transparent-hover": active && !isHubAppearance,
                                    "bg-layer-1-hover": active && isHubAppearance && !selected,
                                    "bg-accent-primary/10 text-primary": selected && isHubAppearance,
                                    "cursor-not-allowed text-placeholder opacity-60": option.disabled,
                                  }
                                )
                              }
                              onClick={() => {
                                if (!multiple) closeDropdown();
                              }}
                              disabled={option.disabled}
                            >
                              {({ selected }) => (
                                <>
                                  <span className="flex-grow truncate">{option.content}</span>
                                  {selected && (
                                    <CheckIcon
                                      className={cn(
                                        "shrink-0",
                                        isHubAppearance ? "size-4 text-accent-primary" : "h-3.5 w-3.5"
                                      )}
                                    />
                                  )}
                                  {option.tooltip && (
                                    <>
                                      {typeof option.tooltip === "string" ? (
                                        <Tooltip tooltipContent={option.tooltip}>
                                          <Info className="h-3.5 w-3.5 flex-shrink-0 cursor-pointer text-secondary" />
                                        </Tooltip>
                                      ) : (
                                        option.tooltip
                                      )}
                                    </>
                                  )}
                                </>
                              )}
                            </Combobox.Option>
                          ))
                        ) : (
                          <p className="px-1.5 py-1 text-placeholder italic">{noResultsMessage}</p>
                        )
                      ) : (
                        <p className="px-1.5 py-1 text-placeholder italic">Loading...</p>
                      )}
                    </div>
                    {footerOption}
                  </div>
                </Combobox.Options>,
                document.body
              )}
          </>
        );
      }}
    </Combobox>
  );
}
