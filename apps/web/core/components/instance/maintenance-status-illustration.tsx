import { OperozMark } from "@operis/propel/icons";
import { useTranslation } from "@operis/i18n";
import { ServerOff } from "lucide-react";

export function MaintenanceStatusIllustration() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-4" aria-hidden>
      <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-subtle bg-accent-primary/5">
        <OperozMark height={44} />
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger-subtle opacity-75" />
          <span className="border-layer-1 relative inline-flex h-4 w-4 rounded-full border-2 bg-danger-subtle" />
        </span>
      </div>
      <div className="flex items-center gap-2 text-tertiary">
        <ServerOff className="h-3.5 w-3.5" />
        <span className="text-11 font-medium tracking-wide uppercase">
          {t("self_hosted_maintenance_message.status_badge")}
        </span>
      </div>
    </div>
  );
}
