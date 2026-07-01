import type { IWorkspaceSidebarNavigationItem } from "@operoz/constants";
import { SidebarItemBase } from "@/components/workspace/sidebar/sidebar-item";

type Props = {
  item: IWorkspaceSidebarNavigationItem;
};

export function SidebarItem({ item }: Props) {
  return <SidebarItemBase item={item} />;
}
