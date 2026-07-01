import { useEffect, useState } from "react";
import { Link } from "react-router";
import { AlertTriangle, X } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { joinUrlPath } from "@operoz/utils";

type Props = {
  workspaceSlug: string;
  workflowId: string;
};

function storageKey(workflowId: string) {
  return `operoz.workflow.open-banner.dismissed.${workflowId}`;
}

export function WorkflowOpenBanner(props: Props) {
  const { workspaceSlug, workflowId } = props;
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(storageKey(workflowId)) === "1";
  });

  useEffect(() => {
    setDismissed(window.localStorage.getItem(storageKey(workflowId)) === "1");
  }, [workflowId]);

  if (dismissed) return null;

  const schemesHref = joinUrlPath(workspaceSlug, "settings/workflow/schemes");

  const handleDismiss = () => {
    window.localStorage.setItem(storageKey(workflowId), "1");
    setDismissed(true);
  };

  return (
    <div
      className="flex shrink-0 items-start gap-3 rounded-md border border-warning-subtle bg-warning-subtle/40 px-4 py-3"
      role="status"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-primary" strokeWidth={1.75} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-13 font-medium text-primary">{t("workflow.open_bootstrap_banner.title")}</p>
        <p className="mt-1 text-12 leading-relaxed text-secondary">{t("workflow.open_bootstrap_banner.body")}</p>
        <Link to={schemesHref} className="mt-2 inline-block text-12 font-medium text-accent-primary hover:underline">
          {t("workflow.open_bootstrap_banner.action")}
        </Link>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="rounded-sm p-1 text-tertiary hover:bg-layer-transparent-hover hover:text-primary"
        aria-label={t("workflow.open_bootstrap_banner.dismiss")}
      >
        <X className="size-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}
