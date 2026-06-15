import { useState } from "react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { TAssistantAutomationProposal, TAutomationGraph } from "@operis/types";
import { BoardService } from "@/services/board/board.service";

const boardService = new BoardService();

type Props = {
  workspaceSlug: string;
  proposal: TAssistantAutomationProposal;
};

export function AssistantAutomationProposal({ workspaceSlug, proposal }: Props) {
  const { t } = useTranslation();
  const [publishing, setPublishing] = useState(false);

  const boardSlug = proposal?.board_slug;
  if (!proposal?.graph || !boardSlug) return null;

  const graph = proposal.graph as TAutomationGraph;
  const nodeCount = graph.nodes?.length ?? 0;
  const dryRunOk = proposal.dry_run?.ok;
  const dryRunStatus = proposal.dry_run?.status;

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const rule = await boardService.createAutomationRule(workspaceSlug, boardSlug, {
        name: proposal.name || t("operoz_assistant.proposal_default_name"),
        description: proposal.description || "",
        graph,
      });
      await boardService.publishAutomationRule(workspaceSlug, boardSlug, rule.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("operoz_assistant.proposal_published"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("operoz_assistant.proposal_publish_failed"),
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="border-accent-primary/30 mt-2 rounded-lg border bg-accent-primary/5 p-3">
      <p className="text-12 font-medium text-primary">{proposal.name}</p>
      <p className="mt-1 text-11 text-tertiary">
        {t("operoz_assistant.proposal_nodes", { count: nodeCount })}
        {proposal.validation?.valid === false ? ` — ${t("operoz_assistant.proposal_invalid")}` : ""}
        {dryRunOk === true
          ? ` — ${t("operoz_assistant.proposal_dry_run_ok")}`
          : dryRunOk === false
            ? ` — ${t("operoz_assistant.proposal_dry_run_failed", { status: dryRunStatus ?? "failed" })}`
            : ""}
      </p>
      <Button
        className="mt-2"
        size="sm"
        variant="primary"
        loading={publishing}
        disabled={proposal.validation?.valid === false}
        onClick={() => void handlePublish()}
      >
        {t("operoz_assistant.proposal_publish")}
      </Button>
    </div>
  );
}
