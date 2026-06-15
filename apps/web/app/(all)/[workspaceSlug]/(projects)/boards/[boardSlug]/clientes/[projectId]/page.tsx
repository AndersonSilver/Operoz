import { Navigate, useParams } from "react-router";

export default function BoardClienteDetailRedirectPage() {
  const { workspaceSlug, projectId } = useParams();

  if (!workspaceSlug || !projectId) return null;

  return <Navigate to={`/${workspaceSlug}/visao-360/${projectId}/`} replace />;
}
