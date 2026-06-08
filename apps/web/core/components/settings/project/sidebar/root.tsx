// plane imports
import { ScrollArea } from "@operis/propel/scrollarea";
import { cn } from "@operis/utils";
// local imports
import { ProjectSettingsSidebarHeader } from "./header";
import { ProjectSettingsSidebarItemCategories } from "./item-categories";

type Props = {
  projectId: string;
  className?: string;
};

export function ProjectSettingsSidebarRoot(props: Props) {
  const { projectId, className } = props;

  return (
    <ScrollArea
      scrollType="hover"
      orientation="vertical"
      size="sm"
      rootClassName={cn(
        "shrink-0 animate-fade-in h-full w-[250px] bg-surface-1 border-r border-r-subtle overflow-y-scroll",
        className
      )}
      viewportClassName="pb-5"
    >
      <ProjectSettingsSidebarHeader projectId={projectId} />
      <ProjectSettingsSidebarItemCategories projectId={projectId} />
    </ScrollArea>
  );
}
