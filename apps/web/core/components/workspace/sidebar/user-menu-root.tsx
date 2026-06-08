import { Fragment, useEffect, useState, type ReactNode } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import ReactDOM from "react-dom";
import { usePopper } from "react-popper";
import { LogOut, Settings, Settings2 } from "lucide-react";
import { Menu, Transition } from "@headlessui/react";
// plane imports
import { GOD_MODE_URL } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import { Avatar } from "@operis/ui";
import { getFileURL } from "@operis/utils";
// components
import { CoverImage } from "@/components/common/cover-image";
import { AppSidebarItem } from "@/components/sidebar/sidebar-item";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useUser } from "@/hooks/store/user";

function UserMenuDropdownSync({ open, children }: { open: boolean; children: ReactNode }) {
  const { toggleAnySidebarDropdown } = useAppTheme();

  useEffect(() => {
    toggleAnySidebarDropdown(open);
  }, [open, toggleAnySidebarDropdown]);

  return <>{children}</>;
}

export const UserMenuRoot = observer(function UserMenuRoot() {
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // router
  const router = useRouter();
  // store hooks
  const { data: currentUser } = useUser();
  const { signOut } = useUser();
  const { toggleProfileSettingsModal } = useCommandPalette();
  // derived values
  const isUserInstanceAdmin = false;
  // translation
  const { t } = useTranslation();

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-end",
    strategy: "fixed",
    modifiers: [
      { name: "offset", options: { offset: [0, 4] } },
      { name: "preventOverflow", options: { padding: 8 } },
      {
        name: "flip",
        options: { fallbackPlacements: ["top-end", "top-start", "bottom-start", "bottom-end"] },
      },
    ],
  });

  const handleSignOut = () => {
    signOut().catch(() =>
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("sign_out.toast.error.title"),
        message: t("sign_out.toast.error.message"),
      })
    );
  };

  return (
    <Menu as="div" className="flex items-center">
      {({ open, close }) => (
        <UserMenuDropdownSync open={open}>
          <>
            <Menu.Button
              ref={setReferenceElement}
              type="button"
              className="flex size-8 items-center justify-center rounded-md outline-none"
              aria-label={t("settings")}
            >
              <AppSidebarItem
                variant="static"
                item={{
                  icon: (
                    <Avatar
                      name={currentUser?.display_name}
                      src={getFileURL(currentUser?.avatar_url ?? "")}
                      size={20}
                      shape="circle"
                    />
                  ),
                  isActive: open,
                }}
              />
            </Menu.Button>
            {open &&
              typeof document !== "undefined" &&
              ReactDOM.createPortal(
                <Transition
                  show={open}
                  as={Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="opacity-0 translate-y-1"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition ease-in duration-150"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-1"
                >
                  <Menu.Items
                    static
                    as="div"
                    ref={setPopperElement}
                    style={styles.popper}
                    {...attributes.popper}
                    data-prevent-outside-click="true"
                    className="fixed z-[100] focus:outline-none"
                  >
                    <div className="my-1 flex w-72 flex-col gap-y-3 rounded-md border-[0.5px] border-subtle-1 bg-surface-1 p-3 text-11">
                      <div className="relative h-29 w-full rounded-lg">
                        <CoverImage
                          src={currentUser?.cover_image_url ?? undefined}
                          alt={currentUser?.display_name}
                          className="h-29 w-full rounded-lg"
                          showDefaultWhenEmpty
                        />
                        <div className="absolute inset-0 bg-layer-1/50" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                          <div className="flex flex-col items-center gap-y-2">
                            <div>
                              <Avatar
                                name={currentUser?.display_name}
                                src={getFileURL(currentUser?.avatar_url ?? "")}
                                size={40}
                                shape="circle"
                                className="text-18 font-medium"
                              />
                            </div>
                            <div className="text-center">
                              <p className="text-body-sm-medium">
                                {currentUser?.first_name} {currentUser?.last_name}
                              </p>
                              <p className="text-caption-md-regular">{currentUser?.email}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Menu.Item
                          as="button"
                          type="button"
                          onClick={() => {
                            toggleProfileSettingsModal({
                              activeTab: "general",
                              isOpen: true,
                            });
                            close();
                          }}
                          className="flex w-full items-center gap-2 rounded-sm px-1 py-1.5 text-left text-secondary hover:bg-layer-transparent-hover"
                        >
                          <Settings className="size-3.5 shrink-0" />
                          {t("settings")}
                        </Menu.Item>
                        <Menu.Item
                          as="button"
                          type="button"
                          onClick={() => {
                            toggleProfileSettingsModal({
                              activeTab: "preferences",
                              isOpen: true,
                            });
                            close();
                          }}
                          className="flex w-full items-center gap-2 rounded-sm px-1 py-1.5 text-left text-secondary hover:bg-layer-transparent-hover"
                        >
                          <Settings2 className="size-3.5 shrink-0" />
                          {t("preferences")}
                        </Menu.Item>
                      </div>
                      <Menu.Item
                        as="button"
                        type="button"
                        onClick={() => {
                          handleSignOut();
                          close();
                        }}
                        className="flex w-full items-center gap-2 rounded-sm px-1 py-1.5 text-left text-secondary hover:bg-layer-transparent-hover"
                      >
                        <LogOut className="size-3.5 shrink-0" />
                        {t("sign_out")}
                      </Menu.Item>
                      {isUserInstanceAdmin && (
                        <Menu.Item
                          as="button"
                          type="button"
                          onClick={() => {
                            router.push(GOD_MODE_URL);
                            close();
                          }}
                          className="bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30 hover:text-accent-secondary"
                        >
                          {t("enter_god_mode")}
                        </Menu.Item>
                      )}
                    </div>
                  </Menu.Items>
                </Transition>,
                document.body
              )}
          </>
        </UserMenuDropdownSync>
      )}
    </Menu>
  );
});
