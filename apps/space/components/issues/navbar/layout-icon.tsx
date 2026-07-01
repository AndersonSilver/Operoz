import type { TIssueLayout } from "@operoz/constants";
import { ListLayoutIcon, BoardLayoutIcon } from "@operoz/propel/icons";
import type { ISvgIcons } from "@operoz/propel/icons";

export function IssueLayoutIcon({
  layout,
  size,
  ...props
}: { layout: TIssueLayout; size?: number } & Omit<ISvgIcons, "width" | "height">) {
  const iconProps = {
    ...props,
    ...(size && { width: size, height: size }),
  };

  switch (layout) {
    case "list":
      return <ListLayoutIcon {...iconProps} />;
    case "kanban":
      return <BoardLayoutIcon {...iconProps} />;
    default:
      return null;
  }
}
