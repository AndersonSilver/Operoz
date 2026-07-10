import { lazy, Suspense } from "react";
import { observer } from "mobx-react";

const ProfileSettingsModal = lazy(() =>
  import("@/components/settings/profile/modal").then((module) => ({
    default: module.ProfileSettingsModal,
  }))
);

const IntegrationsSetupModal = lazy(() =>
  import("@/components/workspace/integrations-setup-modal").then((module) => ({
    default: module.IntegrationsSetupModal,
  }))
);

type TGlobalModalsProps = {
  workspaceSlug: string;
};

/**
 * GlobalModals component manages all workspace-level modals across Plane applications.
 *
 * This includes:
 * - Profile settings modal
 * - Integrations setup modal (blocking on first access when workspace requires integrations)
 */
export const GlobalModals = observer(function GlobalModals({ workspaceSlug }: TGlobalModalsProps) {
  return (
    <Suspense fallback={null}>
      <ProfileSettingsModal />
      <IntegrationsSetupModal workspaceSlug={workspaceSlug} />
    </Suspense>
  );
});
