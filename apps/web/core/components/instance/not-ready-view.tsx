import { GOD_MODE_URL } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import DefaultLayout from "@/layouts/default-layout";
import { OperozLockup, OperozMark } from "@operoz/propel/icons";
import { Button } from "@operoz/propel/button";

export function InstanceNotReady() {
  const { t } = useTranslation();

  return (
    <DefaultLayout>
      <div className="relative z-10 flex h-screen w-screen overflow-hidden">
        {/* Main content */}
        <div className="flex h-full w-full flex-col items-center px-8 pt-6 pb-10">
          <div className="sticky top-0 flex w-full shrink-0 items-center justify-between gap-6">
            <OperozLockup height={20} width={95} className="text-primary" />
          </div>
          <div className="flex h-full w-full flex-col items-center justify-center gap-7">
            <div className="flex flex-col items-center gap-11">
              <OperozMark height={96} />
              <div className="flex max-w-124 flex-col items-center gap-3">
                <h1 className="text-h2-semibold text-primary">{t("instance_not_ready.title")}</h1>
                <p className="text-center text-body-md-regular text-secondary">{t("instance_not_ready.description")}</p>
              </div>
            </div>
            <a href={GOD_MODE_URL} className="w-72">
              <Button variant="primary" className="w-full" size="xl">
                {t("instance_not_ready.cta")}
              </Button>
            </a>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
