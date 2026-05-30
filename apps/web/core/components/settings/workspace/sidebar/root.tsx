// plane imports
import { ScrollArea } from "@operis/propel/scrollarea";
import { cn } from "@operis/utils";
// local imports
import { WorkspaceSettingsSidebarHeader } from "./header";
import { WorkspaceSettingsSidebarItemCategories } from "./item-categories";

type Props = {
  className?: string;
};

export function WorkspaceSettingsSidebarRoot(props: Props) {
  const { className } = props;

  return (
    <ScrollArea
      scrollType="hover"
      orientation="vertical"
      size="sm"
      rootClassName={cn(
        "h-full w-[250px] shrink-0 animate-fade-in overflow-y-scroll border-r border-r-subtle bg-surface-1",
        className
      )}
    >
      <WorkspaceSettingsSidebarHeader />
      <WorkspaceSettingsSidebarItemCategories />
    </ScrollArea>
  );
}
