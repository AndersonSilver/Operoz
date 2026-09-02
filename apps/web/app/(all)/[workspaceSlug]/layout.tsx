import { Outlet } from "react-router";
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";
import { WorkspaceContentWrapper } from "@/operoz-web/components/workspace/content-wrapper";
import { AppRailVisibilityProvider } from "@/operoz-web/hooks/app-rail";
import { GlobalModals } from "@/operoz-web/components/common/modal/global";
import { WorkspaceAuthWrapper } from "@/layouts/auth-layout/workspace-wrapper";
import type { Route } from "./+types/layout";

export default function WorkspaceLayout(props: Route.ComponentProps) {
  const { workspaceSlug } = props.params;

  return (
    <AuthenticationWrapper>
      <WorkspaceAuthWrapper>
        <AppRailVisibilityProvider>
          <WorkspaceContentWrapper>
            <GlobalModals workspaceSlug={workspaceSlug} />
            <Outlet />
          </WorkspaceContentWrapper>
        </AppRailVisibilityProvider>
      </WorkspaceAuthWrapper>
    </AuthenticationWrapper>
  );
}
