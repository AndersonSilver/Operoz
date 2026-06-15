import { CloudOff, Dot } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Tooltip } from "@operis/propel/tooltip";
import { Badge } from "@operis/propel/badge";

type Props = {
  syncStatus: "syncing" | "synced" | "error";
};

export function PageSyncingBadge({ syncStatus }: Props) {
  const { t } = useTranslation();

  if (syncStatus === "synced") return null;

  const isError = syncStatus === "error";

  return (
    <Tooltip
      tooltipHeading={
        isError ? t("project_page.sync_badge.error_heading") : t("project_page.sync_badge.syncing_heading")
      }
      tooltipContent={
        isError ? t("project_page.sync_badge.error_tooltip") : t("project_page.sync_badge.syncing_tooltip")
      }
    >
      <span className="animate-quickFadeIn">
        <Badge
          variant={isError ? "danger" : "brand"}
          size="lg"
          prependIcon={isError ? <CloudOff className="size-3.5" /> : <Dot className="size-3.5" />}
        >
          {isError ? t("project_page.sync_badge.error_label") : t("project_page.sync_badge.syncing_label")}
        </Badge>
      </span>
    </Tooltip>
  );
}
