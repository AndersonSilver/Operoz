import { cn } from "../../utils";

const MARK_LIGHT = "/brand/operoz-mark-light.svg";
const MARK_DARK = "/brand/operoz-mark-dark.svg";

export type TOperozMarkProps = {
  className?: string;
  alt?: string;
  height?: string | number;
  width?: string | number;
};

export function OperozMark({ className, alt = "Operoz", height, width }: TOperozMarkProps) {
  const boxStyle: React.CSSProperties = {};
  if (height !== undefined && height !== "") {
    boxStyle.height = typeof height === "number" ? `${height}px` : height;
  }
  if (width !== undefined && width !== "") {
    boxStyle.maxWidth = typeof width === "number" ? `${width}px` : width;
  }

  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={Object.keys(boxStyle).length > 0 ? boxStyle : undefined}
      role="img"
      aria-label={alt}
    >
      <img
        src={MARK_LIGHT}
        alt={alt}
        className="h-full max-h-full w-auto object-contain dark:hidden"
        draggable={false}
      />
      <img
        src={MARK_DARK}
        alt=""
        aria-hidden
        className="hidden h-full max-h-full w-auto object-contain dark:block"
        draggable={false}
      />
    </span>
  );
}
