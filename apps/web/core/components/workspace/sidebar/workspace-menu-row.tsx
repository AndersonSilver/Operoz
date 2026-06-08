import { observer } from "mobx-react";
import Link from "next/link";
import { Menu } from "@headlessui/react";
import type { IWorkspace } from "@operis/types";
import { cn } from "@operis/utils";
import { WorkspaceLogo } from "../logo";

type Props = {
  workspace: IWorkspace;
  showSlug?: boolean;
  onSelect: (workspace: IWorkspace) => void;
};

export const WorkspaceMenuRow = observer(function WorkspaceMenuRow(props: Props) {
  const { workspace, showSlug = false, onSelect } = props;

  return (
    <Link href={`/${workspace.slug}`} className="w-full" onClick={() => onSelect(workspace)}>
      <Menu.Item
        as="div"
        className={cn(
          "flex w-full items-center gap-2 px-2.5 py-1.5 text-13 transition-colors",
          "text-secondary hover:bg-layer-transparent-hover"
        )}
      >
        <WorkspaceLogo
          logo={workspace.logo_url}
          name={workspace.name}
          classNames="size-6 shrink-0 rounded-md border border-subtle"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-primary">{workspace.name}</p>
          {showSlug ? <p className="truncate text-11 text-tertiary">/{workspace.slug}</p> : null}
        </div>
      </Menu.Item>
    </Link>
  );
});
