import { useState } from "react";
import { Package } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { TAssistantPackInstallProposal } from "@operis/types";
import { BoardService } from "@/services/board/board.service";

const boardService = new BoardService();

type Props = {
  workspaceSlug: string;
  proposal: TAssistantPackInstallProposal;
};

export function AssistantPackInstallProposal({ workspaceSlug, proposal }: Props) {
  const { t } = useTranslation();
  const [installing, setInstalling] = useState(false);

  const boardSlug = proposal.board_slug;
  const packName = proposal.pack_name;
  if (!boardSlug || !packName) return null;

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await boardService.installAutomationPack(workspaceSlug, boardSlug, packName, { create_rules: true });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("operoz_assistant.pack_install_success"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("operoz_assistant.pack_install_failed"),
      });
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="border-accent-primary/30 mt-2 rounded-lg border bg-accent-primary/5 p-3">
      <div className="flex items-start gap-2">
        <Package className="mt-0.5 size-4 shrink-0 text-accent-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-12 font-medium text-primary">{proposal.name || packName}</p>
          {proposal.version ? <p className="text-11 text-tertiary">v{proposal.version}</p> : null}
          {proposal.description ? <p className="mt-1 text-11 text-secondary">{proposal.description}</p> : null}
          <p className="mt-1 text-11 text-tertiary">
            {t("operoz_assistant.pack_install_meta", {
              rules: proposal.rules_count ?? 0,
              hooks: proposal.has_hooks ? 1 : 0,
            })}
          </p>
        </div>
      </div>
      <Button className="mt-2" size="sm" variant="primary" loading={installing} onClick={() => void handleInstall()}>
        {t("operoz_assistant.pack_install_confirm")}
      </Button>
    </div>
  );
}
