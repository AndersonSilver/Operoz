import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

function ErrorPage() {
  const { t } = useTranslation();

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="grid h-screen place-items-center bg-surface-1 p-4">
      <div className="shadow-sm w-full max-w-md rounded-lg border border-subtle bg-layer-1 p-8">
        <div className="flex flex-col items-center gap-4" aria-hidden>
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-subtle bg-danger-primary/5">
            <AlertTriangle className="h-10 w-10 text-danger-primary" strokeWidth={1.5} />
          </div>
          <span className="text-11 font-medium tracking-wide text-tertiary uppercase">
            {t("error_page.status_badge")}
          </span>
        </div>

        <div className="mt-8 flex flex-col gap-5">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-18 font-semibold text-primary">{t("error_page.title")}</h1>
            <p className="text-13 text-secondary">{t("error_page.description")}</p>
          </div>

          <div className="flex justify-center">
            <Button variant="primary" size="lg" prependIcon={<RefreshCw className="h-4 w-4" />} onClick={handleRetry}>
              {t("error_page.retry")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ErrorPage;
