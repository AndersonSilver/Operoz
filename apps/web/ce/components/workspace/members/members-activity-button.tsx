import { useState } from "react";
import { observer } from "mobx-react";
import { EUserPermissions, EUserPermissionsLevel } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { UserActivityIcon } from "@operis/propel/icons";
import { useUserPermissions } from "@/hooks/store/user";
import { MembersActivityModal } from "./members-activity-modal";

export const MembersActivityButton = observer(function MembersActivityButton(props: { workspaceSlug: string }) {
  const { workspaceSlug } = props;
  const { t } = useTranslation();
  const { allowPermissions } = useUserPermissions();
  const [isOpen, setIsOpen] = useState(false);

  const canView = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  if (!canView) return null;

  return (
    <>
      <MembersActivityModal workspaceSlug={workspaceSlug} isOpen={isOpen} onClose={() => setIsOpen(false)} />
      <Button variant="secondary" size="lg" onClick={() => setIsOpen(true)} prependIcon={<UserActivityIcon />}>
        {t("workspace_settings.settings.members.activity.button")}
      </Button>
    </>
  );
});
