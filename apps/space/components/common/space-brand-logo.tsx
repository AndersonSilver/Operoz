import { Link } from "react-router";
import { cn } from "@operoz/utils";
import { spacePublicUrl } from "@/utils/public-asset";

type SpaceBrandLogoProps = {
  className?: string;
  height?: number;
  href?: string;
};

export function SpaceBrandLogo({ className, height = 28, href }: SpaceBrandLogoProps) {
  const logo = (
    <span className={cn("inline-flex shrink-0 items-center", className)} style={{ height }}>
      <img
        src={spacePublicUrl("brand/operoz-lockup-light.svg")}
        alt="Operoz"
        className="block h-full w-auto max-w-[min(100%,240px)] object-contain object-left dark:hidden"
        draggable={false}
      />
      <img
        src={spacePublicUrl("brand/operoz-lockup-dark.svg")}
        alt=""
        aria-hidden
        className="hidden h-full w-auto max-w-[min(100%,240px)] object-contain object-left dark:block"
        draggable={false}
      />
    </span>
  );

  if (!href) return logo;

  return (
    <Link
      to={href}
      className="focus-visible:ring-accent-primary focus-visible:ring-offset-surface-1 inline-flex rounded-lg transition-opacity outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      {logo}
    </Link>
  );
}
