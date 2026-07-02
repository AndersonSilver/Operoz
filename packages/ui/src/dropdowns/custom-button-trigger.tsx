import * as React from "react";
import { cn } from "../utils";

const NATIVE_TRIGGER_TAGS = new Set(["button", "a"]);

const FORWARDING_TRIGGER_DISPLAY_NAMES = new Set([
  "plane-ui-icon-button",
  "plane-ui-button",
  "Tooltip",
  "IssueDetailWidgetButton",
]);

export function unwrapCustomButtonElement(node: React.ReactNode): React.ReactElement | null {
  if (!React.isValidElement(node)) return null;

  let element = node;
  while (element.type === React.Fragment) {
    const children = React.Children.toArray(element.props.children);
    if (children.length !== 1 || !React.isValidElement(children[0])) {
      return null;
    }
    element = children[0];
  }

  return element;
}

export function resolveCustomButtonTrigger(customButton: React.ReactNode): React.ReactElement | null {
  const element = unwrapCustomButtonElement(customButton);
  if (!element) return null;
  if (shouldWrapCustomButtonTrigger(element)) return null;
  return element;
}

export function shouldWrapCustomButtonTrigger(element: React.ReactElement): boolean {
  if (typeof element.type === "string") {
    return !NATIVE_TRIGGER_TAGS.has(element.type);
  }

  const displayName = (element.type as { displayName?: string })?.displayName ?? "";
  return !FORWARDING_TRIGGER_DISPLAY_NAMES.has(displayName);
}

export function assignChildRef<T extends HTMLElement>(node: T | null, customButton: React.ReactNode) {
  const resolved = resolveCustomButtonTrigger(customButton) ?? unwrapCustomButtonElement(customButton);
  if (!resolved) return;
  const childRef = (resolved as React.ReactElement & { ref?: React.Ref<T> }).ref;
  if (typeof childRef === "function") childRef(node);
  else if (childRef && typeof childRef === "object") {
    (childRef as React.MutableRefObject<T | null>).current = node;
  }
}

type MergeableHandler = ((event: React.SyntheticEvent) => void) | undefined;

function mergeHandler(parentHandler: MergeableHandler, childHandler: MergeableHandler) {
  if (parentHandler && childHandler) {
    return (event: React.SyntheticEvent) => {
      parentHandler(event);
      childHandler(event);
    };
  }
  return parentHandler ?? childHandler;
}

export function mergeTriggerElementProps(
  element: React.ReactElement,
  extraProps: Record<string, unknown>
): Record<string, unknown> {
  const merged = {
    ...extraProps,
    ...element.props,
    className: cn(extraProps.className as string | undefined, element.props.className),
    disabled: Boolean(extraProps.disabled) || Boolean(element.props.disabled),
    "aria-label": (extraProps["aria-label"] as string | undefined) ?? element.props["aria-label"],
    tabIndex: (extraProps.tabIndex as number | undefined) ?? element.props.tabIndex,
  };

  for (const key of ["onClick", "onMouseDown", "onPointerDown", "onKeyDown"] as const) {
    merged[key] = mergeHandler(extraProps[key] as MergeableHandler, element.props[key] as MergeableHandler);
  }

  return merged;
}
