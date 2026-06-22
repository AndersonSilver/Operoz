import { useEffect } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import { Outlet } from "react-router";
import { AuthThemeToggle } from "@/components/common/auth-theme-toggle";
// hooks
import { useUser } from "@/hooks/store/use-user";

function RootLayout() {
  // router
  const { replace } = useRouter();
  // store hooks
  const { isUserLoggedIn } = useUser();

  useEffect(() => {
    if (isUserLoggedIn === true) replace("/general");
  }, [replace, isUserLoggedIn]);

  return (
    <div className="relative z-10 flex h-screen w-screen flex-col items-center overflow-hidden overflow-y-auto bg-surface-1 px-8 pt-6 pb-10">
      <AuthThemeToggle />
      <Outlet />
    </div>
  );
}

export default observer(RootLayout);
