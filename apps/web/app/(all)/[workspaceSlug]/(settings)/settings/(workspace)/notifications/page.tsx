import { Navigate, useParams } from "react-router";
import { joinUrlPath } from "@operis/utils";

export default function NotificationsSettingsIndexPage() {
  const { workspaceSlug = "" } = useParams();
  return <Navigate to={joinUrlPath(workspaceSlug, "settings/notifications/rules")} replace />;
}
