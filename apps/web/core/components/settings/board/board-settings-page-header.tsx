/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { Breadcrumbs } from "@plane/ui";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { SettingsPageHeader } from "@/components/settings/page-header";
import type { TBoardSettingsNavItem } from "@/constants/board-settings";
import type { TLogoProps } from "@plane/types";
import { BOARD_SETTINGS_ICONS } from "./sidebar/item-icon";

type Props = {
  workspaceSlug: string;
  workspaceName?: string;
  boardName: string;
  boardSlug: string;
  boardLogo?: TLogoProps;
  section?: TBoardSettingsNavItem;
};

export const BoardSettingsPageHeader = observer(function BoardSettingsPageHeader(props: Props) {
  const { workspaceSlug, workspaceName, boardName, boardSlug, boardLogo, section } = props;
  const { t } = useTranslation();
  const SectionIcon = section ? BOARD_SETTINGS_ICONS[section.key] : undefined;
  const settingsHref = `/${workspaceSlug}/settings/boards/${boardSlug}/`;
  const boardHref = `/${workspaceSlug}/boards/${boardSlug}/`;

  return (
    <SettingsPageHeader
      leftItem={
        <Breadcrumbs>
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                label={workspaceName ?? t("workspace")}
                href={`/${workspaceSlug}/`}
              />
            }
          />
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                label={boardName}
                href={boardHref}
                icon={
                  boardLogo ? (
                    <span className="grid size-4 place-items-center">
                      <Logo logo={boardLogo} size={16} />
                    </span>
                  ) : undefined
                }
              />
            }
          />
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink label={t("boards.settings.title")} href={settingsHref} isLast={!section} />
            }
            isLast={!section}
          />
          {section && (
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label={t(section.i18n_label)}
                  isLast
                  icon={SectionIcon ? <SectionIcon className="size-4 text-tertiary" /> : undefined}
                />
              }
              isLast
            />
          )}
        </Breadcrumbs>
      }
    />
  );
});
