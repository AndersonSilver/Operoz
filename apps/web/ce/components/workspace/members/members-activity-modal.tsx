import { useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import { EModalPosition, EModalWidth, ModalCore } from "@operis/ui";
import { renderFormattedPayloadDate } from "@operis/utils";
import { WorkspaceMemberSelect } from "@/components/workspace/workspace-member-select";
import { UserService } from "@/services/user.service";

const userService = new UserService();

type Props = {
  workspaceSlug: string;
  isOpen: boolean;
  onClose: () => void;
};

export const MembersActivityModal = observer(function MembersActivityModal(props: Props) {
  const { workspaceSlug, isOpen, onClose } = props;
  const { t } = useTranslation();

  const today = renderFormattedPayloadDate(new Date()) ?? "";
  const [memberId, setMemberId] = useState<string>("");
  const [date, setDate] = useState(today);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!memberId || memberId === "none" || !date) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("workspace_settings.settings.members.activity.errors.required"),
      });
      return;
    }

    setIsExporting(true);
    try {
      const csv = await userService.downloadProfileActivity(workspaceSlug, memberId, { date });
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `workspace-member-activity-${date}.csv`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      onClose();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("something_went_wrong"),
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.LG}>
      <div className="flex flex-col gap-5 p-6">
        <div>
          <h3 className="text-16 font-semibold text-primary">{t("workspace_settings.settings.members.activity.title")}</h3>
          <p className="mt-1 text-13 text-tertiary">
            {t("workspace_settings.settings.members.activity.description")}
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-11 font-medium text-secondary">{t("workspace_settings.settings.members.activity.member")}</p>
            <WorkspaceMemberSelect
              workspaceSlug={workspaceSlug}
              value={memberId || null}
              onChange={(val) => setMemberId(val === "none" ? "" : val)}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="activity-date" className="text-11 font-medium text-secondary">
              {t("workspace_settings.settings.members.activity.date")}
            </label>
            <input
              id="activity-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 w-full rounded-md border border-subtle bg-surface-1 px-3 text-13 text-primary"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button variant="primary" loading={isExporting} onClick={handleExport}>
            {t("workspace_settings.settings.members.activity.export")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
