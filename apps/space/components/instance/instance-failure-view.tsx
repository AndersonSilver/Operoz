import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { RefreshCw, Unplug } from "lucide-react";

function InstanceFailureIllustration() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-4" aria-hidden>
      <div className="flex h-24 w-24 items-center justify-center rounded-full border border-subtle bg-accent-primary/5">
        <Unplug className="h-10 w-10 text-accent-primary" strokeWidth={1.5} />
      </div>
      <span className="text-11 font-medium tracking-wide text-tertiary uppercase">
        {t("instance_failure.status_badge")}
      </span>
    </div>
  );
}

export function InstanceFailureView() {
  const { t } = useTranslation();

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="shadow-sm w-full max-w-md rounded-lg border border-subtle bg-layer-1 p-8">
      <InstanceFailureIllustration />

      <div className="mt-8 flex flex-col gap-5">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-18 font-semibold text-primary">{t("instance_failure.title")}</h1>
          <p className="text-13 text-secondary">{t("instance_failure.description")}</p>
        </div>

        <div className="flex justify-center">
          <Button variant="primary" size="lg" prependIcon={<RefreshCw className="h-4 w-4" />} onClick={handleRetry}>
            {t("instance_failure.retry")}
          </Button>
        </div>
      </div>
    </div>
  );
}
