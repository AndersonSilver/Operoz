import { observer } from "mobx-react";
import Link from "next/link";
import useSWR from "swr";
import { useTranslation } from "@operis/i18n";
import type { THomeWidgetProps } from "@operis/types";
import { UserService } from "@/services/user.service";
import { WorkspaceDraftService } from "@/services/issue/workspace_draft.service";
import { WorkspaceNotificationService } from "@/services/workspace-notification.service";
import { useUser } from "@/hooks/store/user";
import { WidgetSection } from "../shared/widget-section";

const userService = new UserService();
const workspaceDraftService = new WorkspaceDraftService();
const workspaceNotificationService = new WorkspaceNotificationService();

export const DaySummaryWidget = observer(function DaySummaryWidget(props: THomeWidgetProps) {
  const { workspaceSlug } = props;
  const { t } = useTranslation();
  const { data: currentUser } = useUser();

  const { data: assignedCount } = useSWR(
    workspaceSlug && currentUser?.id ? `HOME_SUMMARY_ASSIGNED_${workspaceSlug}` : null,
    async () => {
      const response = await userService.getUserProfileIssues(workspaceSlug, currentUser!.id, {
        assignees: currentUser!.id,
        per_page: 1,
      });
      return response?.total_count ?? response?.total_results ?? 0;
    },
    { revalidateOnFocus: false }
  );

  const { data: draftCount } = useSWR(
    workspaceSlug ? `HOME_SUMMARY_DRAFTS_${workspaceSlug}` : null,
    async () => {
      const response = await workspaceDraftService.getIssues(workspaceSlug, { per_page: 1 });
      return response?.total_results ?? response?.total_count ?? 0;
    },
    { revalidateOnFocus: false }
  );

  const { data: unreadCount } = useSWR(
    workspaceSlug ? `HOME_SUMMARY_NOTIFICATIONS_${workspaceSlug}` : null,
    async () => {
      const response = await workspaceNotificationService.fetchUnreadNotificationsCount(workspaceSlug);
      return (
        (response?.total_unread_notifications_count ?? 0) +
        (response?.mention_unread_notifications_count ?? 0)
      );
    },
    { revalidateOnFocus: false }
  );

  const stats = [
    {
      label: t("home.summary.assigned"),
      value: assignedCount ?? "—",
      href: currentUser?.id ? `/${workspaceSlug}/profile/${currentUser.id}/assigned` : undefined,
    },
    {
      label: t("home.summary.drafts"),
      value: draftCount ?? "—",
      href: `/${workspaceSlug}/drafts`,
    },
    {
      label: t("home.summary.notifications"),
      value: unreadCount ?? "—",
      href: `/${workspaceSlug}/notifications`,
    },
  ];

  return (
    <WidgetSection title={t("home.summary.title")}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href ?? "#"}
            className="flex flex-col rounded-xl border border-subtle bg-layer-2 p-4 transition-colors hover:bg-layer-1"
          >
            <span className="text-24 font-semibold text-primary">{stat.value}</span>
            <span className="text-13 text-tertiary">{stat.label}</span>
          </Link>
        ))}
      </div>
    </WidgetSection>
  );
});
