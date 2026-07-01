import type { Placement } from "@popperjs/core";

export const ISSUE_DROPDOWN_PORTAL_Z_CLASS = "z-[100]";

export function getIssueDropdownPopperOptions(placement?: Placement) {
  return {
    placement: placement ?? ("bottom-start" as Placement),
    strategy: "fixed" as const,
    modifiers: [
      { name: "offset", options: { offset: [0, 4] } },
      { name: "preventOverflow", options: { padding: 12 } },
      {
        name: "flip",
        options: {
          fallbackPlacements: ["top-start", "bottom-start", "top-end", "bottom-end"],
        },
      },
    ],
  };
}
