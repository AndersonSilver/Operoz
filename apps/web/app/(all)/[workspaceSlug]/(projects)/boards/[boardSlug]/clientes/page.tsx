import { Navigate, useParams } from "react-router";

export default function BoardClientesRedirectPage() {
  const { workspaceSlug } = useParams();

  if (!workspaceSlug) return null;

  return <Navigate to={`/${workspaceSlug}/visao-360/`} replace />;
}
