import { useState } from "react";
import { observer } from "mobx-react";
import { EUserPermissions, EUserPermissionsLevel } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { TransferIcon } from "@operis/propel/icons";
import type { IWorkspaceBulkInviteFormData } from "@operis/types";
import { useUserPermissions } from "@/hooks/store/user";
import { MembersCsvImportModal } from "./members-csv-import-modal";

type Props = {
  onSubmit: (data: IWorkspaceBulkInviteFormData) => Promise<void>;
};

export const MembersCsvImportButton = observer(function MembersCsvImportButton(props: Props) {
  const { onSubmit } = props;
  const { t } = useTranslation();
  const { allowPermissions } = useUserPermissions();
  const [isOpen, setIsOpen] = useState(false);

  const canImport = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  if (!canImport) return null;

  return (
    <>
      <MembersCsvImportModal isOpen={isOpen} onClose={() => setIsOpen(false)} onSubmit={onSubmit} />
      <Button variant="secondary" size="lg" onClick={() => setIsOpen(true)} prependIcon={<TransferIcon />}>
        {t("workspace_settings.settings.members.csv_import.button")}
      </Button>
    </>
  );
});
