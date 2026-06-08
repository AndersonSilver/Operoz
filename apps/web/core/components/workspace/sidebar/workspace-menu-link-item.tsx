import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Menu } from "@headlessui/react";
import { cn } from "@operis/utils";

type Props = {
  href?: string;
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  variant?: "default" | "danger";
};

export function WorkspaceMenuLinkItem(props: Props) {
  const { href, icon: Icon, label, onClick, variant = "default" } = props;

  const className = cn(
    "flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-12 font-medium transition-colors",
    variant === "danger"
      ? "text-danger-primary hover:bg-layer-transparent-hover"
      : "text-secondary hover:bg-layer-transparent-hover"
  );

  const content = (
    <>
      <Icon className="size-3.5 shrink-0" strokeWidth={1.75} />
      <span className="truncate">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="w-full" onClick={onClick}>
        <Menu.Item as="div" className={className}>
          {content}
        </Menu.Item>
      </Link>
    );
  }

  return (
    <Menu.Item as="button" type="button" className={className} onClick={onClick}>
      {content}
    </Menu.Item>
  );
}
