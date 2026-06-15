import { Outlet } from "react-router";
import { OperozDocsShell } from "@/components/manual/operoz-docs-shell";

export default function WorkspaceManualLayout() {
  return (
    <OperozDocsShell>
      <Outlet />
    </OperozDocsShell>
  );
}
