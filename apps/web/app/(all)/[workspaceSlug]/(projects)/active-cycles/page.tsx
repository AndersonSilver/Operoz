import { observer } from "mobx-react";
// components
import { PageHead } from "@/components/core/page-title";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// operoz web components
import { WorkspaceActiveCyclesRoot } from "@/operoz-web/components/active-cycles";

function WorkspaceActiveCyclesPage() {
  const { currentWorkspace } = useWorkspace();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Active Cycles` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <WorkspaceActiveCyclesRoot />
    </>
  );
}

export default observer(WorkspaceActiveCyclesPage);
