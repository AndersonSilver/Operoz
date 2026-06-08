import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { observer } from "mobx-react";
import { ChevronDown, CirclePlus, LogOut, Mails, Settings, UserPlus } from "lucide-react";
import { Menu, Transition } from "@headlessui/react";
import { EUserPermissions } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { IWorkspace } from "@operis/types";
import { Loader } from "@operis/ui";
import { orderWorkspacesList, cn } from "@operis/utils";
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUser, useUserProfile } from "@/hooks/store/user";
import { useInstance } from "@/hooks/store/use-instance";
import { WorkspaceLogo } from "../logo";
import { WorkspaceMenuLinkItem } from "./workspace-menu-link-item";
import { WorkspaceMenuRow } from "./workspace-menu-row";
import { getOtherWorkspaces, hasAmbiguousWorkspaceNames } from "./workspace-menu-utils";

type WorkspaceMenuRootProps = {
  variant: "sidebar" | "top-navigation";
};

function WorkspaceMenuDropdownSync({ open, children }: { open: boolean; children: ReactNode }) {
  const { toggleAnySidebarDropdown } = useAppTheme();

  useEffect(() => {
    toggleAnySidebarDropdown(open);
  }, [open, toggleAnySidebarDropdown]);

  return <>{children}</>;
}

function useSidebarDropdownPosition(open: boolean, anchorRef: RefObject<HTMLButtonElement | null>) {
  const [style, setStyle] = useState<CSSProperties>();

  useEffect(() => {
    if (!open || !anchorRef.current) {
      setStyle(undefined);
      return;
    }

    const update = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      setStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        maxHeight: `calc(100vh - ${rect.bottom + 8}px)`,
        zIndex: 50,
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef, open]);

  return style;
}

type WorkspaceMenuPanelProps = {
  variant: WorkspaceMenuRootProps["variant"];
  open: boolean;
  close: () => void;
};

const WorkspaceMenuPanel = observer(function WorkspaceMenuPanel(props: WorkspaceMenuPanelProps) {
  const { variant, open, close } = props;
  const isSidebar = variant === "sidebar";
  const sidebarMenuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarDropdownStyle = useSidebarDropdownPosition(open, sidebarMenuButtonRef);
  const { toggleSidebar } = useAppTheme();
  const { config } = useInstance();
  const { signOut } = useUser();
  const { updateUserProfile } = useUserProfile();
  const { currentWorkspace: activeWorkspace, workspaces } = useWorkspace();
  const isWorkspaceCreationDisabled = config?.is_workspace_creation_disabled ?? false;
  const { t } = useTranslation();

  const handleWorkspaceNavigation = (workspace: IWorkspace) => updateUserProfile({ last_workspace_id: workspace?.id });

  const handleSignOut = async () => {
    await signOut().catch(() =>
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("sign_out.toast.error.title"),
        message: t("sign_out.toast.error.message"),
      })
    );
  };

  const handleItemClick = () => {
    if (window.innerWidth < 768) toggleSidebar();
    close();
  };

  const workspacesList = orderWorkspacesList(Object.values(workspaces ?? {}));
  const otherWorkspaces = getOtherWorkspaces(workspacesList, activeWorkspace?.id);
  const showWorkspaceSlug = workspacesList.length > 1 || hasAmbiguousWorkspaceNames(workspacesList);
  const canOpenSettings =
    activeWorkspace &&
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER].includes(activeWorkspace.role);
  const canInvite = activeWorkspace && [EUserPermissions.ADMIN].includes(activeWorkspace.role);

  return (
    <WorkspaceMenuDropdownSync open={open}>
      <Menu.Button
        ref={isSidebar ? sidebarMenuButtonRef : undefined}
        className={cn(
          "group/menu-button flex w-full items-center gap-2 text-left transition-colors focus:outline-none",
          isSidebar
            ? "rounded-md px-2 py-1.5 hover:bg-layer-transparent-hover"
            : "max-w-48 flex-grow justify-between truncate rounded-sm p-1 text-13 font-medium text-secondary hover:bg-layer-1",
          isSidebar && open && "bg-layer-transparent-active"
        )}
        aria-label={t("aria_labels.projects_sidebar.open_workspace_switcher")}
      >
        <WorkspaceLogo
          logo={activeWorkspace?.logo_url}
          name={activeWorkspace?.name}
          classNames={cn("shrink-0 rounded-md border border-subtle", isSidebar ? "size-6" : "size-7")}
        />
        <div className="min-w-0 flex-1">
          <p className={cn("truncate font-medium text-primary", isSidebar ? "text-13" : "text-14")}>
            {activeWorkspace?.name ?? t("loading")}
          </p>
        </div>
        <ChevronDown
          className={cn("shrink-0 text-tertiary transition-transform", isSidebar ? "size-3.5" : "size-4", {
            "rotate-180": open,
          })}
          strokeWidth={1.75}
        />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <Menu.Items as={Fragment}>
          <div
            style={isSidebar ? sidebarDropdownStyle : undefined}
            className={cn(
              "flex flex-col overflow-hidden rounded-lg border border-subtle bg-surface-1 py-1 shadow-raised-200 outline-none",
              isSidebar ? "min-h-0" : "fixed top-10 left-4 z-21 mt-1 w-[15rem]"
            )}
          >
            {otherWorkspaces.length > 0 ? (
              <div className="vertical-scrollbar scrollbar-sm min-h-0 max-h-40 flex-1 overflow-y-auto py-0.5">
                <p className="px-2.5 pt-1.5 pb-1 text-11 font-medium text-tertiary">
                  {t("workspace_switcher.switch_to")}
                </p>
                {otherWorkspaces.map((workspace) => (
                  <WorkspaceMenuRow
                    key={workspace.id}
                    workspace={workspace}
                    showSlug={showWorkspaceSlug}
                    onSelect={(ws) => {
                      handleWorkspaceNavigation(ws);
                      handleItemClick();
                    }}
                  />
                ))}
              </div>
            ) : workspacesList.length === 0 ? (
              <div className="px-2.5 py-2">
                <Loader className="space-y-2">
                  <Loader.Item height="28px" />
                </Loader>
              </div>
            ) : null}

            {activeWorkspace && (canOpenSettings || canInvite) && (
              <div className="border-t border-subtle py-1">
                {canOpenSettings && (
                  <WorkspaceMenuLinkItem
                    href={`/${activeWorkspace.slug}/settings`}
                    icon={Settings}
                    label={t("settings")}
                    onClick={handleItemClick}
                  />
                )}
                {canInvite && (
                  <WorkspaceMenuLinkItem
                    href={`/${activeWorkspace.slug}/settings/members`}
                    icon={UserPlus}
                    label={t("project_settings.members.invite_members.title")}
                    onClick={handleItemClick}
                  />
                )}
              </div>
            )}

            <div className="border-t border-subtle py-1">
              {!isWorkspaceCreationDisabled && (
                <WorkspaceMenuLinkItem
                  href="/create-workspace"
                  icon={CirclePlus}
                  label={t("create_workspace")}
                  onClick={handleItemClick}
                />
              )}
              <WorkspaceMenuLinkItem
                href="/invitations"
                icon={Mails}
                label={t("workspace_invites")}
                onClick={handleItemClick}
              />
              <WorkspaceMenuLinkItem icon={LogOut} label={t("sign_out")} onClick={handleSignOut} variant="danger" />
            </div>
          </div>
        </Menu.Items>
      </Transition>
    </WorkspaceMenuDropdownSync>
  );
});

export const WorkspaceMenuRoot = observer(function WorkspaceMenuRoot(props: WorkspaceMenuRootProps) {
  const { variant } = props;

  return (
    <Menu
      as="div"
      className={cn("relative", variant === "sidebar" ? "w-full" : "w-fit max-w-48 flex-grow")}
    >
      {({ open, close }: { open: boolean; close: () => void }) => (
        <WorkspaceMenuPanel variant={variant} open={open} close={close} />
      )}
    </Menu>
  );
});
