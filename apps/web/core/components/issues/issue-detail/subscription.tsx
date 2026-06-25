import { useEffect, useState } from "react";
import { isNil } from "lodash-es";
import { observer } from "mobx-react";
import { Bell, BellOff } from "lucide-react";
// plane-i18n
import { EUserPermissions, EUserPermissionsLevel } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
// UI
import { Button } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import { EIssueServiceType } from "@operis/types";
import { Loader } from "@operis/ui";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useUserPermissions } from "@/hooks/store/user";

export type TIssueSubscription = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  serviceType?: EIssueServiceType;
};

export const IssueSubscription = observer(function IssueSubscription(props: TIssueSubscription) {
  const { workspaceSlug, projectId, issueId, serviceType = EIssueServiceType.ISSUES } = props;
  const { t } = useTranslation();
  // hooks
  const {
    subscription: { getSubscriptionByIssueId },
    createSubscription,
    removeSubscription,
    fetchSubscriptions,
    issue: { getIssueById },
  } = useIssueDetail(serviceType);
  // state
  const [loading, setLoading] = useState(false);
  const [isFetchingStatus, setIsFetchingStatus] = useState(false);
  // hooks
  const { allowPermissions } = useUserPermissions();

  const issue = getIssueById(issueId);
  const subscriptionFromMap = getSubscriptionByIssueId(issueId);
  const isSubscribed = subscriptionFromMap ?? issue?.is_subscribed;

  useEffect(() => {
    if (!isNil(subscriptionFromMap)) return;
    if (!workspaceSlug || !projectId || !issueId) return;

    setIsFetchingStatus(true);
    void fetchSubscriptions(workspaceSlug, projectId, issueId).finally(() => {
      setIsFetchingStatus(false);
    });
  }, [fetchSubscriptions, issueId, projectId, subscriptionFromMap, workspaceSlug]);
  const isEditable = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );

  const handleSubscription = async () => {
    setLoading(true);
    try {
      if (isSubscribed) await removeSubscription(workspaceSlug, projectId, issueId);
      else await createSubscription(workspaceSlug, projectId, issueId);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: isSubscribed
          ? t("issue.subscription.actions.unsubscribed")
          : t("issue.subscription.actions.subscribed"),
      });
      setLoading(false);
    } catch {
      setLoading(false);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("common.error.message"),
      });
    }
  };

  if (isNil(isSubscribed) && isFetchingStatus)
    return (
      <Loader>
        <Loader.Item width="106px" height="28px" />
      </Loader>
    );

  if (isNil(isSubscribed)) return null;

  return (
    <div>
      <Button
        prependIcon={isSubscribed ? <BellOff /> : <Bell className="h-3 w-3" />}
        variant="secondary"
        className="hover:!bg-accent-primary/20"
        onClick={handleSubscription}
        disabled={!isEditable || loading}
        size="lg"
      >
        {loading ? (
          <span>
            <span className="hidden sm:block">{t("common.loading")}</span>
          </span>
        ) : isSubscribed ? (
          <div className="hidden sm:block">{t("common.actions.unsubscribe")}</div>
        ) : (
          <div className="hidden sm:block">{t("common.actions.subscribe")}</div>
        )}
      </Button>
    </div>
  );
});
