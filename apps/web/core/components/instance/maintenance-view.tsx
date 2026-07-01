import { OperozLockup } from "@operoz/propel/icons";
// layouts
import DefaultLayout from "@/layouts/default-layout";
// components
import { MaintenanceMessage } from "@/plane-web/components/instance";
import { MaintenanceStatusIllustration } from "./maintenance-status-illustration";

export function MaintenanceView() {
  return (
    <DefaultLayout className="bg-canvas">
      <div className="flex h-full w-full items-center justify-center px-6 py-10">
        <div className="shadow-sm w-full max-w-md rounded-lg border border-subtle bg-layer-1 p-8">
          <div className="mb-8 flex justify-center">
            <OperozLockup height={28} />
          </div>

          <MaintenanceStatusIllustration />

          <div className="mt-8">
            <MaintenanceMessage />
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
