import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { SPACE_BASE_PATH } from "@operoz/constants";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
import { SpaceBrandLogo } from "@/components/common/space-brand-logo";
import { InstanceFailureView } from "@/components/instance/instance-failure-view";
// hooks
import { useInstance } from "@/hooks/store/use-instance";
import { useUser } from "@/hooks/store/use-user";

export const InstanceProvider = observer(function InstanceProvider({ children }: { children: React.ReactNode }) {
  const { fetchInstanceInfo, instance, error } = useInstance();
  const { fetchCurrentUser } = useUser();

  useSWR("INSTANCE_INFO", () => fetchInstanceInfo(), {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    errorRetryCount: 0,
  });
  useSWR("CURRENT_USER", () => fetchCurrentUser(), {
    shouldRetryOnError: false,
    revalidateOnFocus: true,
    revalidateIfStale: true,
  });

  if (!instance && !error)
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LogoSpinner />
      </div>
    );

  if (error) {
    return (
      <div className="relative isolate flex min-h-screen flex-col bg-surface-1">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-32 left-1/2 h-[min(50vh,420px)] w-[min(100vw,640px)] -translate-x-1/2 rounded-full bg-accent-primary/[0.1] blur-[80px] dark:bg-accent-primary/[0.14]" />
          <div
            className="absolute inset-0 opacity-[0.14] dark:opacity-[0.08]"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, var(--border-color-subtle) 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
        </div>

        <header className="relative z-10 container mx-auto flex h-[72px] shrink-0 items-center px-5 lg:px-8">
          <SpaceBrandLogo height={28} href={`${SPACE_BASE_PATH}/`} />
        </header>

        <main className="relative z-10 flex flex-1 items-center justify-center px-5 pb-10">
          <InstanceFailureView />
        </main>
      </div>
    );
  }

  return children;
});
