import { useCallback, useState } from "react";
import { cn } from "@operis/utils";
import { Link2 } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import { WorkspaceService } from "@/services/workspace.service";
import type { TClient360QbrGuestLink } from "@/services/guest-qbr.service";

type Props = {
  workspaceSlug: string;
  projectId: string;
  periodStart: string;
  periodEnd: string;
  weeks?: number;
  includeCompare?: boolean;
  variant?: "primary" | "secondary" | "tertiary" | "ghost" | "link";
  size?: "sm" | "base" | "lg" | "xl";
  className?: string;
};

const workspaceService = new WorkspaceService();

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function Client360GuestShareButton({
  workspaceSlug,
  projectId,
  periodStart,
  periodEnd,
  weeks = 13,
  includeCompare = false,
  variant = "secondary",
  size = "sm",
  className,
}: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const createAndCopy = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const link: TClient360QbrGuestLink = await workspaceService.createClient360QbrGuestLink(workspaceSlug, {
        scope: "client",
        project_id: projectId,
        period_start: periodStart,
        period_end: periodEnd,
        weeks,
        include_compare: includeCompare,
      });
      const copied = await copyToClipboard(link.url);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("boards.client_360.guest_link_created_title"),
        message: copied ? t("boards.client_360.guest_link_created_clipboard") : link.url,
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("boards.client_360.guest_link_error_title"),
        message: t("boards.client_360.guest_link_error_message"),
      });
    } finally {
      setLoading(false);
    }
  }, [includeCompare, loading, periodEnd, periodStart, projectId, t, weeks, workspaceSlug]);

  return (
    <Button
      variant={variant}
      size={size}
      disabled={loading}
      onClick={createAndCopy}
      className={cn("shrink-0", className)}
    >
      <Link2 className="size-3.5" strokeWidth={1.75} />
      {loading ? t("boards.client_360.guest_link_creating") : t("boards.client_360.guest_link_share")}
    </Button>
  );
}
