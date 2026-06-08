import { Outlet } from "react-router";
import { AuxiliaryCollapsibleSidebar } from "@/components/sidebar/auxiliary-collapsible-sidebar";
import { NotificationsSidebarRoot } from "@/components/workspace-notifications/sidebar";

const INBOX_SIDEBAR_WIDTH = 320;

export default function ProjectInboxIssuesLayout() {
  return (
    <div className="relative flex h-full w-full min-w-0 flex-row overflow-hidden">
      <div className="hidden h-full shrink-0 md:block">
        <AuxiliaryCollapsibleSidebar storageKey="inbox_sidebar_pinned" width={INBOX_SIDEBAR_WIDTH}>
          <NotificationsSidebarRoot embedded />
        </AuxiliaryCollapsibleSidebar>
      </div>
      <main className="h-full min-w-0 flex-1 overflow-hidden overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
