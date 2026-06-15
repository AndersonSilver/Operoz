import * as React from "react";

import { cn } from "../../utils";

const LOGO_LIGHT = "/brand/operoz-lockup-light.svg";
const LOGO_DARK = "/brand/operoz-lockup-dark.svg";

export type TBrandMarkProps = {
  className?: string;
  alt?: string;
  height?: string | number;
  width?: string | number;
};

export function BrandMark({ className, alt = "Operoz", height, width }: TBrandMarkProps) {
  const boxStyle: React.CSSProperties = {};
  if (height !== undefined && height !== "") {
    boxStyle.height = typeof height === "number" ? `${height}px` : height;
  }
  if (width !== undefined && width !== "") {
    boxStyle.maxWidth = typeof width === "number" ? `${width}px` : width;
  }

  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-start leading-none", className)}
      style={Object.keys(boxStyle).length > 0 ? boxStyle : undefined}
    >
      <img
        src={LOGO_LIGHT}
        alt={alt}
        className="block h-full max-h-full w-auto object-contain object-left dark:hidden"
        draggable={false}
      />
      <img
        src={LOGO_DARK}
        alt=""
        aria-hidden
        className="hidden h-full max-h-full w-auto object-contain object-left dark:block"
        draggable={false}
      />
    </span>
  );
}
