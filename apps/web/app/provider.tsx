import { lazy, Suspense } from "react";
import { useTheme } from "next-themes";
import { SWRConfig } from "swr";
// Plane Imports
import { WEB_SWR_CONFIG } from "@operoz/constants";
import { TranslationProvider } from "@operoz/i18n";
import { Toast } from "@operoz/propel/toast";
// helpers
import { resolveGeneralTheme } from "@operoz/utils";
import { LogoSpinner } from "@/components/common/logo-spinner";
// mobx store provider
import { StoreProvider } from "@/lib/store-context";

// lazy imports
const AppProgressBar = lazy(function AppProgressBar() {
  return import("@/lib/b-progress/AppProgressBar");
});

const StoreWrapper = lazy(function StoreWrapper() {
  return import("@/lib/wrappers/store-wrapper");
});

const InstanceWrapper = lazy(function InstanceWrapper() {
  return import("@/lib/wrappers/instance-wrapper");
});

export interface IAppProvider {
  children: React.ReactNode;
}

export function AppProvider(props: IAppProvider) {
  const { children } = props;
  // themes
  const { resolvedTheme } = useTheme();

  return (
    <StoreProvider>
      <TranslationProvider>
        <Toast theme={resolveGeneralTheme(resolvedTheme)} />
        <Suspense fallback={null}>
          <AppProgressBar />
        </Suspense>
        <Suspense
          fallback={
            <div className="relative flex h-screen w-full items-center justify-center bg-canvas">
              <LogoSpinner />
            </div>
          }
        >
          <StoreWrapper>
            <InstanceWrapper>
              <Suspense fallback={null}>
                <SWRConfig value={WEB_SWR_CONFIG}>{children}</SWRConfig>
              </Suspense>
            </InstanceWrapper>
          </StoreWrapper>
        </Suspense>
      </TranslationProvider>
    </StoreProvider>
  );
}
