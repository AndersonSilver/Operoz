import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@operis/i18n";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { IBoard, IBoardAutomationPolicy, IBoardAutomationPublishAudit } from "@operis/types";
import { Button } from "@operis/propel/button";
import { Loader, TextArea } from "@operis/ui";
import { BoardService } from "@/services/board/board.service";

const boardService = new BoardService();

export const BoardAutomationPolicySettings = observer(function BoardAutomationPolicySettings(props: {
  workspaceSlug: string;
  board: IBoard;
}) {
  const { workspaceSlug, board } = props;
  const { t } = useTranslation();
  const [policy, setPolicy] = useState<IBoardAutomationPolicy | null>(null);
  const [audits, setAudits] = useState<IBoardAutomationPublishAudit[]>([]);
  const [domainsText, setDomainsText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [policyData, auditData] = await Promise.all([
      boardService.getAutomationPolicy(workspaceSlug, board.slug),
      boardService.getAutomationPublishAudits(workspaceSlug, board.slug),
    ]);
    setPolicy(policyData);
    setDomainsText((policyData.webhook_allowed_domains || []).join("\n"));
    setAudits(auditData);
  }, [workspaceSlug, board.slug]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load()
      .catch(() => {
        if (!cancelled) {
          setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const handleSave = async () => {
    if (!policy) return;
    setSaving(true);
    try {
      const domains = domainsText
        .split(/\n|,/)
        .map((line) => line.trim())
        .filter(Boolean);
      const updated = await boardService.updateAutomationPolicy(workspaceSlug, board.slug, {
        webhook_allowlist_enabled: policy.webhook_allowlist_enabled,
        webhook_allowed_domains: domains,
        script_timeout_seconds: policy.script_timeout_seconds,
        script_max_memory_mb: policy.script_max_memory_mb,
        script_block_dangerous_imports: policy.script_block_dangerous_imports,
        require_dry_run_before_enable: policy.require_dry_run_before_enable,
      });
      setPolicy(updated);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.settings.automation.policy.save_success"),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !policy) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-2 text-13 text-tertiary">
        <Loader />
        {t("loading")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-16 font-semibold text-primary">{t("boards.settings.automation.policy.title")}</h2>
        <p className="mt-1 text-13 text-secondary">{t("boards.settings.automation.policy.subtitle")}</p>
      </div>

      <div className="space-y-4 rounded-lg border border-subtle bg-layer-1 p-4">
        <label className="flex items-center gap-2 text-13 text-primary">
          <input
            type="checkbox"
            checked={policy.webhook_allowlist_enabled}
            onChange={(e) => setPolicy({ ...policy, webhook_allowlist_enabled: e.target.checked })}
          />
          {t("boards.settings.automation.policy.webhook_allowlist")}
        </label>
        <label className="block text-12 text-secondary">
          {t("boards.settings.automation.policy.domains_label")}
          <TextArea
            className="font-mono mt-1 min-h-[88px] text-12"
            value={domainsText}
            onChange={(e) => setDomainsText(e.target.value)}
            placeholder="api.example.com&#10;hooks.allowed.example"
          />
        </label>
        <label className="flex items-center gap-2 text-13 text-primary">
          <input
            type="checkbox"
            checked={policy.script_block_dangerous_imports}
            onChange={(e) => setPolicy({ ...policy, script_block_dangerous_imports: e.target.checked })}
          />
          {t("boards.settings.automation.policy.script_sandbox")}
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-12 text-secondary">
            {t("boards.settings.automation.policy.script_timeout")}
            <input
              type="number"
              min={1}
              max={120}
              className="mt-1 w-full rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-13"
              value={policy.script_timeout_seconds}
              onChange={(e) => setPolicy({ ...policy, script_timeout_seconds: Number(e.target.value) || 10 })}
            />
          </label>
          <label className="block text-12 text-secondary">
            {t("boards.settings.automation.policy.script_memory")}
            <input
              type="number"
              min={32}
              max={512}
              className="mt-1 w-full rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-13"
              value={policy.script_max_memory_mb}
              onChange={(e) => setPolicy({ ...policy, script_max_memory_mb: Number(e.target.value) || 128 })}
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-13 text-primary">
          <input
            type="checkbox"
            checked={policy.require_dry_run_before_enable}
            onChange={(e) => setPolicy({ ...policy, require_dry_run_before_enable: e.target.checked })}
          />
          {t("boards.settings.automation.policy.require_dry_run")}
        </label>
        <Button variant="primary" size="sm" disabled={saving} onClick={() => void handleSave()}>
          {t("save")}
        </Button>
      </div>

      <div>
        <h3 className="text-14 font-semibold text-primary">{t("boards.settings.automation.policy.audit_title")}</h3>
        <div className="mt-2 space-y-2">
          {audits.length === 0 ? (
            <p className="text-13 text-tertiary">{t("boards.settings.automation.policy.audit_empty")}</p>
          ) : (
            audits.map((audit) => (
              <div key={audit.id} className="rounded-md border border-subtle bg-layer-1 p-3 text-12">
                <p className="font-medium text-primary">
                  {audit.rule_name} · v{audit.published_version}
                </p>
                <p className="text-tertiary">
                  {audit.published_by_name || "—"} · {new Date(audit.published_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
});
