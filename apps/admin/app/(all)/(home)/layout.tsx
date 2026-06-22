import { useEffect } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import { Outlet } from "react-router";
import { AuthThemeToggle } from "@/components/common/auth-theme-toggle";
// hooks
import { useUser } from "@/hooks/store/use-user";
import { AdminBrandLogo } from "./admin-brand-logo";
import { AuthBrandPanel } from "./auth-brand-panel";

function RootLayout() {
  const { replace } = useRouter();
  const { isUserLoggedIn } = useUser();

  useEffect(() => {
    if (isUserLoggedIn === true) replace("/general");
  }, [replace, isUserLoggedIn]);

  return (
    <div className="relative isolate flex min-h-screen w-full overflow-x-hidden overflow-y-auto bg-surface-1">
      <AuthThemeToggle />
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 left-1/2 h-[min(60vh,480px)] w-[min(100vw,720px)] -translate-x-1/2 rounded-full bg-accent-primary/[0.12] blur-[88px] dark:bg-accent-primary/[0.16]" />
        <div className="absolute -right-20 bottom-0 h-[min(45vh,360px)] w-[min(90vw,520px)] rounded-full bg-accent-primary/[0.06] blur-[72px]" />
        <div
          className="absolute inset-0 opacity-[0.18] lg:hidden dark:opacity-[0.1]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, var(--border-color-subtle) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen w-full">
        <AuthBrandPanel />

        <div className="flex min-h-screen w-full flex-1 flex-col lg:min-h-0">
          <div className="mx-auto flex w-full max-w-[32rem] flex-1 flex-col px-5 pt-7 pb-10 sm:px-8 sm:pt-10 lg:max-w-[36rem] lg:px-12 lg:pt-12 xl:px-16">
            <div className="mb-8 lg:hidden">
              <AdminBrandLogo height={36} />
            </div>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

export default observer(RootLayout);
