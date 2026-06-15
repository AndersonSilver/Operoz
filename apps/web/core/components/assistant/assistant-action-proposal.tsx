import { useState } from "react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { TAssistantActionProposal } from "@operis/types";
import { AssistantService } from "@/services/assistant.service";

const assistantService = new AssistantService();

type Props = {
  workspaceSlug: string;
  sessionId: string;
  proposal: TAssistantActionProposal;
};

export function AssistantActionProposal({ workspaceSlug, sessionId, proposal }: Props) {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);

  if (!proposal?.action_type) return null;

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await assistantService.confirmAction(workspaceSlug, sessionId, proposal);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("operoz_assistant.action_confirmed"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("operoz_assistant.action_confirm_failed"),
      });
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="border-caution/40 bg-caution-subtle/30 mt-2 rounded-lg border p-3">
      <p className="text-12 font-medium text-primary">{proposal.summary}</p>
      {proposal.comment ? <p className="mt-1 text-11 text-secondary">{proposal.comment}</p> : null}
      {proposal.state_name ? (
        <p className="mt-1 text-11 text-tertiary">
          {t("operoz_assistant.action_state_target", { state: proposal.state_name })}
        </p>
      ) : null}
      <Button className="mt-2" size="sm" variant="primary" loading={confirming} onClick={() => void handleConfirm()}>
        {t("operoz_assistant.action_confirm")}
      </Button>
    </div>
  );
}
