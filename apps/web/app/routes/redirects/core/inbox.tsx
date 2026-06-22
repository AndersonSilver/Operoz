import { redirect } from "react-router";
import type { Route } from "./+types/inbox";

export const clientLoader = ({ params }: Route.ClientLoaderArgs) => {
  const { workspaceSlug, projectId } = params;
  throw redirect(`/${workspaceSlug}/projects/${projectId}/sustentacao/`);
};

export default function Inbox() {
  return null;
}
