import {
  Bell,
  Bolt,
  CircleDot,
  Clock3,
  Code2,
  CornerDownRight,
  Edit3,
  Folder,
  GitBranch,
  Globe,
  Mail,
  MessageSquare,
  Pencil,
  Play,
  type LucideIcon,
} from "lucide-react";
import clsx from "clsx";

const ICON_MAP: Record<string, LucideIcon> = {
  bolt: Bolt,
  clock: Clock3,
  bell: Bell,
  code: Code2,
  mail: Mail,
  pencil: Pencil,
  "message-square": MessageSquare,
  globe: Globe,
  folder: Folder,
  "circle-dot": CircleDot,
  user: CircleDot,
  edit: Edit3,
  "git-branch": GitBranch,
  "corner-down-right": CornerDownRight,
  play: Play,
};

type Props = {
  name?: string | null;
  className?: string;
};

export function AutomationCatalogIcon({ name, className }: Props) {
  const Icon = (name && ICON_MAP[name]) || Play;
  return <Icon className={clsx("shrink-0", className)} aria-hidden />;
}

export const AUTOMATION_KIND_DEFAULT_ICON: Record<"trigger" | "filter" | "action" | "decision", string> = {
  trigger: "bolt",
  filter: "circle-dot",
  action: "play",
  decision: "git-branch",
};
