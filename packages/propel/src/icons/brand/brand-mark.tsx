import * as React from "react";

import { cn } from "../../utils";

const LOGO_LIGHT = "/brand/logo-preto.png";
const LOGO_DARK = "/brand/logo-branca.png";

export type TBrandMarkProps = {
  className?: string;
  alt?: string;
  height?: string | number;
  width?: string | number;
};

export function BrandMark({ className, alt = "Logo", height, width }: TBrandMarkProps) {
  const boxStyle: React.CSSProperties = {};
  if (height !== undefined && height !== "") {
    boxStyle.height = typeof height === "number" ? `${height}px` : height;
  }
  if (width !== undefined && width !== "") {
    boxStyle.maxWidth = typeof width === "number" ? `${width}px` : width;
  }

  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-start", className)}
      style={Object.keys(boxStyle).length > 0 ? boxStyle : undefined}
    >
      <img
        src={LOGO_LIGHT}
        alt={alt}
        className="h-full w-auto max-h-full object-contain object-left dark:hidden"
        draggable={false}
      />
      <img
        src={LOGO_DARK}
        alt=""
        aria-hidden
        className="hidden h-full w-auto max-h-full object-contain object-left dark:block"
        draggable={false}
      />
    </span>
  );
}
