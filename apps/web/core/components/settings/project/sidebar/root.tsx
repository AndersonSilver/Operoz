// plane imports
import { ScrollArea } from "@operoz/propel/scrollarea";
import { cn } from "@operoz/utils";
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
        "h-full w-[250px] shrink-0 animate-fade-in overflow-y-scroll border-r border-r-subtle bg-surface-1",
        className
      )}
      viewportClassName="pb-5"
    >
      <ProjectSettingsSidebarHeader projectId={projectId} />
      <ProjectSettingsSidebarItemCategories projectId={projectId} />
    </ScrollArea>
  );
}
