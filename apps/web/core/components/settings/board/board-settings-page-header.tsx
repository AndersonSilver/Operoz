import { observer } from "mobx-react";
import { useTranslation } from "@operis/i18n";
import { Logo } from "@operis/propel/emoji-icon-picker";
import { Breadcrumbs } from "@operis/ui";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { SettingsPageHeader } from "@/components/settings/page-header";
import type { TBoardSettingsNavItem } from "@/constants/board-settings";
import type { TLogoProps } from "@operis/types";
import { BOARD_SETTINGS_ICONS } from "./sidebar/item-icon";

type Props = {
  workspaceSlug: string;
  /** @deprecated só compat — breadcrumb não repete workspace */
  workspaceName?: string;
  boardName: string;
  boardSlug: string;
  boardLogo?: TLogoProps;
  section?: TBoardSettingsNavItem;
};

export const BoardSettingsPageHeader = observer(function BoardSettingsPageHeader(props: Props) {
  const { workspaceSlug, boardName, boardSlug, boardLogo, section } = props;
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
                label={boardName}
                href={boardHref}
                icon={
                  boardLogo ? (
                    <span className="grid size-4 place-items-center">
                      <Logo logo={boardLogo} size={16} />
                    </span>
                  ) : undefined
                }
                isLast={!section}
              />
            }
            isLast={!section}
          />
          {section && (
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label={t(section.i18n_label)}
                  href={`/${workspaceSlug}/settings/boards/${boardSlug}${section.href}/`}
                  isLast
                  icon={SectionIcon ? <SectionIcon className="size-4 text-tertiary" strokeWidth={1.75} /> : undefined}
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
