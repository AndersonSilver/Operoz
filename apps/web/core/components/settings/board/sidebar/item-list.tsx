import { useState } from "react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { useParams } from "react-router";
import { useTranslation } from "@operis/i18n";
import { BOARD_SETTINGS_NAV } from "@/constants/board-settings";
import { SettingsSidebarItem } from "@/components/settings/sidebar/item";
import { BOARD_SETTINGS_ICONS } from "./item-icon";
import { BoardSettingsNavGroup } from "./nav-group";

function normalizeSettingsPath(path: string) {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

function isBoardSettingsPathActive(pathname: string, basePath: string, href: string) {
  const current = normalizeSettingsPath(pathname);
  const base = normalizeSettingsPath(basePath);
  if (href === "") {
    return current === base;
  }
  const full = normalizeSettingsPath(`${basePath}${href}`);
  return current === full;
}

export const BoardSettingsSidebarItemList = observer(function BoardSettingsSidebarItemList() {
  const { workspaceSlug, boardSlug } = useParams();
  const pathname = usePathname();
  const { t } = useTranslation();
  const basePath = `/${workspaceSlug}/settings/boards/${boardSlug}`;

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    BOARD_SETTINGS_NAV.forEach((item) => {
      if (item.children?.length) {
        const open = item.children.some((child) => isBoardSettingsPathActive(pathname, basePath, child.href));
        if (open) initial[item.key] = true;
      }
    });
    return initial;
  });

  return (
    <nav className="flex flex-col gap-0.5 px-2 py-2" aria-label={t("boards.settings.title")}>
      {BOARD_SETTINGS_NAV.map((item) => {
        const Icon = BOARD_SETTINGS_ICONS[item.key];
        const hasChildren = Boolean(item.children?.length);

        if (!hasChildren) {
          const href = `${basePath}${item.href}/`;
          return (
            <SettingsSidebarItem
              key={item.key}
              as="link"
              href={href}
              isActive={isBoardSettingsPathActive(pathname, basePath, item.href)}
              icon={Icon}
              label={t(item.i18n_label)}
            />
          );
        }

        const isGroupActive = item.children!.some((child) =>
          isBoardSettingsPathActive(pathname, basePath, child.href)
        );
        const isOpen = expanded[item.key] ?? isGroupActive;

        return (
          <BoardSettingsNavGroup
            key={item.key}
            label={t(item.i18n_label)}
            icon={Icon}
            isOpen={isOpen}
            isActive={isGroupActive}
            onToggle={() => setExpanded((prev) => ({ ...prev, [item.key]: !isOpen }))}
          >
            {item.children!.map((child) => {
              const ChildIcon = BOARD_SETTINGS_ICONS[child.key] ?? Icon;
              const href = `${basePath}${child.href}/`;
              return (
                <SettingsSidebarItem
                  key={child.key}
                  as="link"
                  href={href}
                  isActive={isBoardSettingsPathActive(pathname, basePath, child.href)}
                  icon={ChildIcon}
                  label={t(child.i18n_label)}
                />
              );
            })}
          </BoardSettingsNavGroup>
        );
      })}
    </nav>
  );
});
