import { observer } from "mobx-react";
import { Outlet } from "react-router";
// operoz web imports
import { AutomationsListWrapper } from "@/operoz-web/components/automations/list/wrapper";
import type { Route } from "./+types/layout";

function AutomationsListLayout({ params }: Route.ComponentProps) {
  const { projectId, workspaceSlug } = params;

  return (
    <AutomationsListWrapper projectId={projectId} workspaceSlug={workspaceSlug}>
      <Outlet />
    </AutomationsListWrapper>
  );
}

export default observer(AutomationsListLayout);
