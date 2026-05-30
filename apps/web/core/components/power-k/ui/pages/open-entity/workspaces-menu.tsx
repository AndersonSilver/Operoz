import { observer } from "mobx-react";
// plane types
import type { IWorkspace } from "@operis/types";
import { Spinner } from "@operis/ui";
// components
import { PowerKWorkspacesMenu } from "@/components/power-k/menus/workspaces";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";

type Props = {
  handleSelect: (workspace: IWorkspace) => void;
};

export const PowerKOpenWorkspaceMenu = observer(function PowerKOpenWorkspaceMenu(props: Props) {
  const { handleSelect } = props;
  // store hooks
  const { loader, workspaces } = useWorkspace();
  // derived values
  const workspacesList = workspaces ? Object.values(workspaces) : [];

  if (loader) return <Spinner />;

  return <PowerKWorkspacesMenu workspaces={workspacesList} onSelect={handleSelect} />;
});
