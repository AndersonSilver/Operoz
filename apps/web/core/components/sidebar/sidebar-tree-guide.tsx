import { cn } from "@operis/utils";
import { SIDEBAR_TREE_GUIDE_LINE_CLASS } from "./sidebar-styles";

type Props = {
  className?: string;
};

/** Linha tracejada vertical da árvore (boards → projetos → tabs). */
export function SidebarTreeGuide(props: Props) {
  const { className } = props;
  return <div className={cn(SIDEBAR_TREE_GUIDE_LINE_CLASS, className)} aria-hidden />;
}
