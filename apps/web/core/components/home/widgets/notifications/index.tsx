import { observer } from "mobx-react";
import Link from "next/link";
import useSWR from "swr";
import { useTranslation } from "@operoz/i18n";
import type { THomeWidgetProps, TNotification } from "@operoz/types";
import { calculateTimeAgo } from "@operoz/utils";
import { WorkspaceNotificationService } from "@/services/workspace-notification.service";
import { WidgetSection } from "../shared/widget-section";

const workspaceNotificationService = new WorkspaceNotificationService();

function getNotificationTitle(notification: TNotification): string {
  const issueName = notification?.data?.issue?.name;
  if (issueName) return issueName;
  return notification?.data?.issue_activity?.verb || notification?.title || "";
}

export const NotificationsWidget = observer(function NotificationsWidget(props: THomeWidgetProps) {
  const { workspaceSlug } = props;
  const { t } = useTranslation();

  const { data: notifications, isLoading } = useSWR(
    workspaceSlug ? `HOME_NOTIFICATIONS_${workspaceSlug}` : null,
    async () => {
      const response = await workspaceNotificationService.fetchNotifications(workspaceSlug, {
        per_page: 5,
        read: false,
      });
      return response?.results ?? [];
    },
    { revalidateOnFocus: false }
  );

  return (
    <WidgetSection
      title={t("home.notifications.title")}
      action={
        <Link
          href={`/${workspaceSlug}/notifications`}
          className="text-13 font-medium text-accent-primary hover:text-accent-secondary"
        >
          {t("home.notifications.view_all")}
        </Link>
      }
    >
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-md bg-layer-2" />
          ))}
        </div>
      ) : notifications && notifications.length > 0 ? (
        <div className="flex flex-col divide-y divide-subtle rounded-lg border border-subtle">
          {notifications.map((notification) => (
            <Link
              key={notification.id}
              href={`/${workspaceSlug}/notifications`}
              className="flex flex-col gap-1 px-3 py-3 transition-colors hover:bg-layer-1"
            >
              <span className="line-clamp-1 text-13 font-medium text-primary">
                {getNotificationTitle(notification)}
              </span>
              {notification.created_at && (
                <span className="text-11 text-tertiary">{calculateTimeAgo(notification.created_at)}</span>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-13 text-tertiary">{t("home.notifications.empty")}</p>
      )}
    </WidgetSection>
  );
});
