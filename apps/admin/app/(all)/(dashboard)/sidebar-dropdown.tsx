import { Fragment, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useTheme as useNextTheme } from "next-themes";
import { LogOut, Moon, Sun, UserCog2 } from "lucide-react";
import { Menu, Transition } from "@headlessui/react";
import { useTranslation } from "@operis/i18n";
import { API_BASE_URL } from "@operis/constants";
import { AuthService } from "@operis/services";
import { Avatar } from "@operis/ui";
import { getFileURL, cn } from "@operis/utils";
import { useTheme, useUser } from "@/hooks/store";

const authService = new AuthService();

export const AdminSidebarDropdown = observer(function AdminSidebarDropdown() {
  const { isSidebarCollapsed } = useTheme();
  const { currentUser, signOut } = useUser();
  const { resolvedTheme, setTheme } = useNextTheme();
  const { t } = useTranslation();
  const [csrfToken, setCsrfToken] = useState<string | undefined>(undefined);

  const handleThemeSwitch = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const handleSignOut = () => signOut();

  const themeLabel =
    resolvedTheme === "dark" ? t("god_mode.sidebar.switch_to_light") : t("god_mode.sidebar.switch_to_dark");

  const getSidebarMenuItems = () => (
    <Menu.Items
      className={cn(
        "shadow-lg absolute left-0 z-20 mt-1.5 flex w-52 flex-col divide-y divide-subtle rounded-md border border-subtle bg-surface-1 px-1 py-2 text-11 outline-none",
        {
          "left-4": isSidebarCollapsed,
        }
      )}
    >
      <div className="flex flex-col gap-2.5 pb-2">
        <span className="truncate px-2 text-secondary">{currentUser?.email}</span>
      </div>
      <div className="py-2">
        <Menu.Item
          as="button"
          type="button"
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1 hover:bg-layer-1-hover"
          onClick={handleThemeSwitch}
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4 stroke-[1.5]" />
          ) : (
            <Moon className="h-4 w-4 stroke-[1.5]" />
          )}
          {themeLabel}
        </Menu.Item>
      </div>
      <div className="py-2">
        <form method="POST" action={`${API_BASE_URL}/api/instances/admins/sign-out/`} onSubmit={handleSignOut}>
          <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />
          <Menu.Item
            as="button"
            type="submit"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1 hover:bg-layer-1-hover"
          >
            <LogOut className="h-4 w-4 stroke-[1.5]" />
            {t("god_mode.sidebar.sign_out")}
          </Menu.Item>
        </form>
      </div>
    </Menu.Items>
  );

  useEffect(() => {
    if (csrfToken === undefined)
      void authService
        .requestCSRFToken()
        .then((data) => data?.csrf_token && setCsrfToken(data.csrf_token))
        .catch((error) => {
          console.error("Failed to fetch CSRF token:", error);
        });
  }, [csrfToken]);

  return (
    <div className="flex max-h-header items-center gap-x-5 gap-y-2 border-b border-subtle px-4 py-2.5">
      <div className="h-full w-full truncate">
        <div
          className={`flex flex-grow items-center gap-x-2 truncate rounded-sm ${
            isSidebarCollapsed ? "justify-center" : ""
          }`}
        >
          <Menu as="div" className="flex-shrink-0">
            <Menu.Button
              className={cn("grid place-items-center outline-none", {
                "cursor-default": !isSidebarCollapsed,
              })}
            >
              <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-sm bg-layer-1">
                <UserCog2 className="size-5 text-primary" />
              </div>
            </Menu.Button>
            {isSidebarCollapsed && (
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                {getSidebarMenuItems()}
              </Transition>
            )}
          </Menu>

          {!isSidebarCollapsed && (
            <div className="flex w-full gap-2">
              <h4 className="grow truncate text-body-md-medium text-primary">{t("god_mode.brand.instance_admin")}</h4>
            </div>
          )}
        </div>
      </div>

      {!isSidebarCollapsed && currentUser && (
        <Menu as="div" className="relative flex-shrink-0">
          <Menu.Button className="grid place-items-center outline-none">
            <Avatar
              name={currentUser.display_name}
              src={getFileURL(currentUser.avatar_url)}
              size={24}
              shape="square"
              className="!text-body-sm-medium"
            />
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            {getSidebarMenuItems()}
          </Transition>
        </Menu>
      )}
    </div>
  );
});
