import { observer } from "mobx-react";
import { useTranslation } from "@operis/i18n";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { IWorkspace } from "@operis/types";
import { ToggleSwitch } from "@operis/ui";
import { useWorkspace } from "@/hooks/store/use-workspace";

type NotificationFlagKey =
  | "issue_notify_assignees_always_email"
  | "issue_notify_email_include_extended_activities"
  | "issue_notify_email_include_description_changes"
  | "issue_notify_email_dispatch_immediately";

type FlagConfig = {
  key: NotificationFlagKey;
  titleKey: string;
  descriptionKey: string;
};

const FLAGS: FlagConfig[] = [
  {
    key: "issue_notify_assignees_always_email",
    titleKey: "boards.settings.notifications.flags.assignees_always.title",
    descriptionKey: "boards.settings.notifications.flags.assignees_always.description",
  },
  {
    key: "issue_notify_email_include_extended_activities",
    titleKey: "boards.settings.notifications.flags.extended_activities.title",
    descriptionKey: "boards.settings.notifications.flags.extended_activities.description",
  },
  {
    key: "issue_notify_email_include_description_changes",
    titleKey: "boards.settings.notifications.flags.description_changes.title",
    descriptionKey: "boards.settings.notifications.flags.description_changes.description",
  },
  {
    key: "issue_notify_email_dispatch_immediately",
    titleKey: "boards.settings.notifications.flags.immediate_dispatch.title",
    descriptionKey: "boards.settings.notifications.flags.immediate_dispatch.description",
  },
];

export const BoardNotificationsSettings = observer(function BoardNotificationsSettings(props: {
  workspaceSlug: string;
}) {
  const { workspaceSlug } = props;
  const { t } = useTranslation();
  const { currentWorkspace, updateWorkspace } = useWorkspace();

  const patchFlag = async (key: NotificationFlagKey, value: boolean) => {
    if (!currentWorkspace) return;
    try {
      await updateWorkspace(workspaceSlug, { [key]: value } as Partial<IWorkspace>);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.settings.notifications.save_success"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("something_went_wrong"),
      });
    }
  };

  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-13 text-tertiary">{t("boards.settings.notifications.lead")}</p>
      <div className="flex flex-col divide-y divide-subtle rounded-md border border-subtle bg-surface-1">
        {FLAGS.map((flag) => (
          <div key={flag.key} className="flex items-start justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="text-13 font-medium text-primary">{t(flag.titleKey)}</p>
              <p className="mt-1 text-11 leading-5 text-tertiary">{t(flag.descriptionKey)}</p>
            </div>
            <ToggleSwitch
              value={Boolean(currentWorkspace?.[flag.key])}
              onChange={(next) => patchFlag(flag.key, next)}
              size="sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
});
