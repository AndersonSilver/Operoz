import { forwardRef } from "react";
import Link from "next/link";
import { cn } from "@operoz/utils";

// ============================================================================
// TYPES
// ============================================================================

interface AppSidebarItemData {
  href?: string;
  label?: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  showLabel?: boolean;
}

interface AppSidebarItemProps {
  variant?: "link" | "button" | "static";
  item?: AppSidebarItemData;
}

interface AppSidebarItemLabelProps {
  highlight?: boolean;
  label?: string;
}

interface AppSidebarItemIconProps {
  icon?: React.ReactNode;
  highlight?: boolean;
}

interface AppSidebarLinkItemProps {
  href?: string;
  children: React.ReactNode;
  className?: string;
}

interface AppSidebarButtonItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

interface AppSidebarStaticItemProps {
  children: React.ReactNode;
  className?: string;
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  base: "group flex flex-col gap-0.5 items-center justify-center text-tertiary",
  icon: "flex items-center justify-center gap-2 size-8 rounded-md text-tertiary",
  iconActive: "bg-layer-transparent-selected text-secondary !text-icon-primary",
  iconInactive: "group-hover:text-icon-secondary group-hover:bg-layer-transparent-hover !text-icon-tertiary",
  label: "text-11 font-medium",
  labelActive: "text-secondary",
  labelInactive: "group-hover:text-secondary text-tertiary",
} as const;

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function AppSidebarItemLabel({ highlight = false, label }: AppSidebarItemLabelProps) {
  if (!label) return null;

  return (
    <span
      className={cn(styles.label, {
        [styles.labelActive]: highlight,
        [styles.labelInactive]: !highlight,
      })}
    >
      {label}
    </span>
  );
}

function AppSidebarItemIcon({ icon, highlight }: AppSidebarItemIconProps) {
  if (!icon) return null;

  return (
    <div
      className={cn(styles.icon, {
        [styles.iconActive]: highlight,
        [styles.iconInactive]: !highlight,
      })}
    >
      {icon}
    </div>
  );
}

const AppSidebarLinkItem = forwardRef<HTMLAnchorElement, AppSidebarLinkItemProps>(function AppSidebarLinkItem(
  { href, children, className },
  ref
) {
  if (!href) return null;

  return (
    <Link ref={ref} href={href} className={cn(styles.base, className)}>
      {children}
    </Link>
  );
});

const AppSidebarButtonItem = forwardRef<HTMLButtonElement, AppSidebarButtonItemProps>(function AppSidebarButtonItem(
  { children, onClick, disabled = false, className },
  ref
) {
  return (
    <button ref={ref} className={cn(styles.base, className)} onClick={onClick} disabled={disabled} type="button">
      {children}
    </button>
  );
});

/** Non-interactive shell for menu triggers that already render as a button (Headless UI / CustomMenu). */
const AppSidebarStaticItem = forwardRef<HTMLDivElement, AppSidebarStaticItemProps>(function AppSidebarStaticItem(
  { children, className },
  ref
) {
  return (
    <div ref={ref} className={cn(styles.base, className)}>
      {children}
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AppSidebarItemBase = forwardRef<HTMLAnchorElement | HTMLButtonElement | HTMLDivElement, AppSidebarItemProps>(
  function AppSidebarItem({ variant = "link", item }, ref) {
    if (!item) return null;

    const { icon, isActive, label, href, onClick, disabled, showLabel = true } = item;

    const commonItems = (
      <>
        <AppSidebarItemIcon icon={icon} highlight={isActive} />
        {showLabel && <AppSidebarItemLabel highlight={isActive} label={label} />}
      </>
    );

    if (variant === "link") {
      return (
        <AppSidebarLinkItem ref={ref as React.Ref<HTMLAnchorElement>} href={href}>
          {commonItems}
        </AppSidebarLinkItem>
      );
    }

    if (variant === "static") {
      return <AppSidebarStaticItem ref={ref as React.Ref<HTMLDivElement>}>{commonItems}</AppSidebarStaticItem>;
    }

    return (
      <AppSidebarButtonItem ref={ref as React.Ref<HTMLButtonElement>} onClick={onClick} disabled={disabled}>
        {commonItems}
      </AppSidebarButtonItem>
    );
  }
);

// ============================================================================
// COMPOUND COMPONENT EXPORT
// ============================================================================

// Object.assign produces a correctly-typed compound component without mutating
// the ForwardRefExoticComponent returned by forwardRef (which TypeScript does not
// allow extending via direct property assignment).
export const AppSidebarItem = Object.assign(AppSidebarItemBase, {
  Label: AppSidebarItemLabel,
  Icon: AppSidebarItemIcon,
  Link: AppSidebarLinkItem,
  Button: AppSidebarButtonItem,
  Static: AppSidebarStaticItem,
});

export type { AppSidebarItemData, AppSidebarItemProps };
