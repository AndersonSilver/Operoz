import { SUPPORT_EMAIL } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { RefreshCw } from "lucide-react";

export function MaintenanceMessage() {
  const { t } = useTranslation();

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-18 font-semibold text-primary">{t("self_hosted_maintenance_message.title")}</h1>
        <p className="text-13 text-secondary">{t("self_hosted_maintenance_message.description")}</p>
        <p className="text-11 text-tertiary">{t("self_hosted_maintenance_message.dev_hint")}</p>
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button variant="primary" size="lg" prependIcon={<RefreshCw className="h-4 w-4" />} onClick={handleRetry}>
          {t("self_hosted_maintenance_message.retry")}
        </Button>
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-13 text-accent-primary hover:underline">
          {t("self_hosted_maintenance_message.contact_support")}
        </a>
      </div>
    </div>
  );
}
