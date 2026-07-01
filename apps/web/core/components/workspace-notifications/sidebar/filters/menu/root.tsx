import { observer } from "mobx-react";
import { ListFilter } from "lucide-react";
// plane imports
import type { ENotificationFilterType } from "@operoz/constants";
import { FILTER_TYPE_OPTIONS } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import { Tooltip } from "@operoz/propel/tooltip";
import { PopoverMenu } from "@operoz/ui";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// local imports
import { NotificationFilterOptionItem } from "./menu-option-item";
import { IconButton } from "@operoz/propel/icon-button";

export const NotificationFilter = observer(function NotificationFilter() {
  // hooks
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();

  const translatedFilterTypeOptions = FILTER_TYPE_OPTIONS.map((filter) => ({
    ...filter,
    label: t(filter.i18n_label),
  }));

  return (
    <PopoverMenu
      data={translatedFilterTypeOptions}
      button={
        <Tooltip tooltipContent={t("notification.options.filters")} isMobile={isMobile} position="bottom">
          <IconButton size="base" variant="ghost" icon={ListFilter} />
        </Tooltip>
      }
      keyExtractor={(item: { label: string; value: ENotificationFilterType }) => item.value}
      render={(item) => <NotificationFilterOptionItem {...item} />}
    />
  );
});
