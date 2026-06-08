import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { useParams } from "react-router";
// plane imports
import { EUserPermissionsLevel, GROUPED_WORKSPACE_SETTINGS, WORKSPACE_SETTINGS_CATEGORIES } from "@operis/constants";
import { ENABLE_WORKSPACE_BOARDS } from "@/constants/enable-boards";
import { useTranslation } from "@operis/i18n";
import { joinUrlPath } from "@operis/utils";
// components
import { SettingsSidebarItem } from "@/components/settings/sidebar/item";
import { SidebarSectionHeader } from "@/components/sidebar/sidebar-section-header";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import { WORKSPACE_SETTINGS_ICONS } from "./item-icon";

export const WorkspaceSettingsSidebarItemCategories = observer(function WorkspaceSettingsSidebarItemCategories() {
  // params
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  // translation
  const { t } = useTranslation();

  return (
    <div className="mt-3 flex flex-col divide-y divide-subtle px-3">
      {WORKSPACE_SETTINGS_CATEGORIES.map((category) => {
        const categoryItems = GROUPED_WORKSPACE_SETTINGS[category];
        const accessibleItems = categoryItems.filter((item) => {
          if (item.key === "boards" && !ENABLE_WORKSPACE_BOARDS) return false;
          return allowPermissions(item.access, EUserPermissionsLevel.WORKSPACE, workspaceSlug);
        });

        if (accessibleItems.length === 0) return null;

        return (
          <div key={category} className="shrink-0 py-3 first:pt-0 last:pb-0">
            <SidebarSectionHeader label={t(category)} className="px-0 pt-2 pb-1 first:pt-0" />
            <div className="flex flex-col">
              {accessibleItems.map((item) => {
                const isItemActive =
                  item.href === "/settings"
                    ? pathname === `/${workspaceSlug}${item.href}/`
                    : new RegExp(`^/${workspaceSlug}${item.href}/`).test(pathname);

                return (
                  <SettingsSidebarItem
                    key={item.key}
                    as="link"
                    href={joinUrlPath(workspaceSlug ?? "", item.href)}
                    isActive={isItemActive}
                    icon={WORKSPACE_SETTINGS_ICONS[item.key]}
                    label={t(item.i18n_label)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
});
