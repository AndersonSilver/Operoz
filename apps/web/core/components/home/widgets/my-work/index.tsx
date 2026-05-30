import { observer } from "mobx-react";
import Link from "next/link";
import useSWR from "swr";
import { useTranslation } from "@operis/i18n";
import type { THomeWidgetProps } from "@operis/types";
import { UserService } from "@/services/user.service";
import { useUser } from "@/hooks/store/user";
import { WidgetSection } from "../shared/widget-section";
import { extractIssuesFromResponse } from "../shared/extract-issues";
import { WorkItemRow } from "../shared/work-item-row";

const userService = new UserService();

export const MyWorkWidget = observer(function MyWorkWidget(props: THomeWidgetProps) {
  const { workspaceSlug } = props;
  const { t } = useTranslation();
  const { data: currentUser } = useUser();

  const { data: issues, isLoading } = useSWR(
    workspaceSlug && currentUser?.id ? `HOME_MY_WORK_${workspaceSlug}` : null,
    async () => {
      const response = await userService.getUserProfileIssues(workspaceSlug, currentUser!.id, {
        assignees: currentUser!.id,
        per_page: 8,
        order_by: "-target_date",
      });
      return extractIssuesFromResponse(response, 8);
    },
    { revalidateOnFocus: false }
  );

  const viewAllHref = currentUser?.id ? `/${workspaceSlug}/profile/${currentUser.id}/assigned` : undefined;

  return (
    <WidgetSection
      title={t("home.my_work.title")}
      action={
        viewAllHref ? (
          <Link href={viewAllHref} className="text-13 font-medium text-accent-primary hover:text-accent-secondary">
            {t("home.my_work.view_all")}
          </Link>
        ) : undefined
      }
    >
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-md bg-layer-2" />
          ))}
        </div>
      ) : issues && issues.length > 0 ? (
        <div className="flex flex-col divide-y divide-subtle rounded-lg border border-subtle">
          {issues.map((issue) => (
            <WorkItemRow key={issue.id} issue={issue} workspaceSlug={workspaceSlug} />
          ))}
        </div>
      ) : (
        <p className="text-13 text-tertiary">{t("home.my_work.empty")}</p>
      )}
    </WidgetSection>
  );
});
