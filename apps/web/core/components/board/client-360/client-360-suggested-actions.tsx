import { useCallback, useEffect, useState } from "react";
import { Lightbulb, X } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import type { TClient360SuggestedAction, TClient360ScenarioPlaybook } from "@operis/types";
import { Client360Section } from "@/components/board/client-360/client-360-ui";
import { Client360ScenarioPlaybookDrawer } from "@/components/board/client-360/client-360-scenario-playbook-drawer";
import { WorkspaceService } from "@/services/workspace.service";

const workspaceService = new WorkspaceService();

type Props = {
  workspaceSlug: string;
  projectId: string;
  period: { start: string; end: string };
};

export function Client360SuggestedActions({ workspaceSlug, projectId, period }: Props) {
  const { t } = useTranslation();
  const [actions, setActions] = useState<TClient360SuggestedAction[]>([]);
  const [playbooks, setPlaybooks] = useState<TClient360ScenarioPlaybook[]>([]);
  const [openPlaybook, setOpenPlaybook] = useState<TClient360ScenarioPlaybook | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await workspaceService.getClient360SuggestedActions(workspaceSlug, projectId, {
        period_start: period.start,
        period_end: period.end,
      });
      setActions(payload.actions || []);
      setPlaybooks(payload.playbooks || []);
    } catch {
      setActions([]);
      setPlaybooks([]);
    } finally {
      setLoading(false);
    }
  }, [period.end, period.start, projectId, workspaceSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  const dismiss = useCallback(
    async (actionKey: string) => {
      await workspaceService.dismissClient360SuggestedAction(workspaceSlug, projectId, actionKey);
      setActions((current) => current.filter((action) => action.key !== actionKey));
    },
    [projectId, workspaceSlug]
  );

  return (
    <>
      <Client360Section
        sectionId="suggested-actions"
        icon={Lightbulb}
        iconTone="accent"
        title={t("boards.client_360.intelligence_actions_title")}
        description={t("boards.client_360.intelligence_actions_subtitle")}
      >
        {loading ? (
          <p className="text-13 text-tertiary">{t("loading")}…</p>
        ) : actions.length === 0 ? (
          <p className="text-13 text-tertiary">{t("boards.client_360.intelligence_actions_empty")}</p>
        ) : (
          <ul className="space-y-1.5">
            {actions.map((action) => (
              <li
                key={action.key}
                className="flex items-start justify-between gap-2 rounded-sm border border-subtle bg-layer-2/30 px-2.5 py-2"
              >
                <div className="min-w-0">
                  <p className="text-13 font-medium text-primary">{action.title}</p>
                  <p className="text-12 text-secondary">{action.reason}</p>
                  {action.href ? (
                    <Link href={action.href} className="text-12 text-accent-primary hover:underline">
                      {t("boards.client_360.intelligence_actions_open")}
                    </Link>
                  ) : null}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={t("common.dismiss")}
                  onClick={() => void dismiss(action.key)}
                >
                  <X className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        {playbooks.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {playbooks.map((playbook) => (
              <Button
                key={playbook.playbook_code}
                variant="secondary"
                size="sm"
                onClick={() => setOpenPlaybook(playbook)}
              >
                {playbook.playbook_code}: {playbook.title}
              </Button>
            ))}
          </div>
        ) : null}
      </Client360Section>
      <Client360ScenarioPlaybookDrawer playbook={openPlaybook} onClose={() => setOpenPlaybook(null)} />
    </>
  );
}
