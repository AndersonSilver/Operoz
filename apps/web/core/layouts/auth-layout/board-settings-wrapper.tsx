import type { ReactNode } from "react";
import { observer } from "mobx-react";
import { Navigate } from "react-router";
import { EUserPermissions, EUserPermissionsLevel } from "@operis/constants";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { ENABLE_WORKSPACE_BOARDS } from "@/constants/enable-boards";
import { useUserPermissions } from "@/hooks/store/user";

type Props = {
  workspaceSlug: string;
  children: ReactNode;
};

export const BoardSettingsAuthWrapper = observer(function BoardSettingsAuthWrapper(props: Props) {
  const { workspaceSlug, children } = props;
  const { allowPermissions, workspaceUserInfo } = useUserPermissions();
  const canAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  if (!ENABLE_WORKSPACE_BOARDS) {
    return <Navigate to={`/${workspaceSlug}/settings/`} replace />;
  }

  if (workspaceUserInfo && !canAdmin) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  return <>{children}</>;
});
