import {
  Archive,
  BarChart3,
  CircleDot,
  FilePenLine,
  FolderKanban,
  Home,
  Inbox,
  LayoutGrid,
  ScanEye,
  StickyNote,
  UserRound,
} from "lucide-react";
import { cn } from "@operoz/utils";

const ICON_CLASS = "size-3.5 shrink-0";

export const getSidebarNavigationItemIcon = (key: string, className: string = "") => {
  const props = { className: cn(ICON_CLASS, className), strokeWidth: 1.75 as const };

  switch (key) {
    case "home":
      return <Home {...props} />;
    case "inbox":
      return <Inbox {...props} />;
    case "projects":
      return <FolderKanban {...props} />;
    case "visao_360":
      return <ScanEye {...props} />;
    case "views":
      return <LayoutGrid {...props} />;
    case "active_cycles":
      return <CircleDot {...props} />;
    case "analytics":
      return <BarChart3 {...props} />;
    case "your_work":
      return <UserRound {...props} />;
    case "drafts":
      return <FilePenLine {...props} />;
    case "archives":
      return <Archive {...props} />;
    case "stickies":
      return <StickyNote {...props} />;
    default:
      return null;
  }
};
