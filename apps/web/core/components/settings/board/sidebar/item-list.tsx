/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { BOARD_SETTINGS_NAV } from "@/constants/board-settings";
import { SettingsSidebarItem } from "@/components/settings/sidebar/item";
import { BOARD_SETTINGS_ICONS } from "./item-icon";

function normalizeSettingsPath(path: string) {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

/** Só a rota exacta fica activa (evita `/tipos` activo em `/tipos/projeto`). */
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
    <div className="mt-3 flex flex-col px-3">
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
        const isExpanded = expanded[item.key] ?? isGroupActive;

        return (
          <div key={item.key} className="flex flex-col">
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-body-sm-medium text-secondary transition-colors",
                isGroupActive ? "text-primary" : "hover:bg-layer-transparent-hover"
              )}
              onClick={() => setExpanded((prev) => ({ ...prev, [item.key]: !isExpanded }))}
            >
              <span className="grid size-4 shrink-0 place-items-center">
                <Icon className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1 truncate">{t(item.i18n_label)}</span>
              <ChevronDown className={cn("size-3.5 shrink-0 text-tertiary transition-transform", { "rotate-180": isExpanded })} />
            </button>
            {isExpanded && (
              <div className="ml-4 flex flex-col border-l border-subtle pl-2">
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
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});
