import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Mail, Server, Shield } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import { Loader } from "@operoz/ui";
import { PageWrapper } from "@/components/common/page-wrapper";
import { AdminEmptyState, AdminSettingsPanel, AdminToggleCard } from "@/components/settings/admin-settings-panel";
import { useInstance } from "@/hooks/store";
import type { Route } from "./+types/page";
import { InstanceEmailForm } from "./email-config-form";

const InstanceEmailPage = observer(function InstanceEmailPage(_props: Route.ComponentProps) {
  const { t } = useTranslation();
  const { fetchInstanceConfigurations, formattedConfig, disableEmail } = useInstance();

  const { isLoading } = useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSMTPEnabled, setIsSMTPEnabled] = useState(false);

  const handleToggle = async () => {
    if (isSMTPEnabled) {
      setIsSubmitting(true);
      try {
        await disableEmail();
        setIsSMTPEnabled(false);
        setToast({
          title: t("god_mode.pages.email.disabled_title"),
          message: t("god_mode.pages.email.disabled_message"),
          type: TOAST_TYPE.SUCCESS,
        });
      } catch (_error) {
        setToast({
          title: t("god_mode.pages.email.disable_error_title"),
          message: t("god_mode.pages.email.disable_error_message"),
          type: TOAST_TYPE.ERROR,
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    setIsSMTPEnabled(true);
  };

  useEffect(() => {
    if (formattedConfig) {
      setIsSMTPEnabled(formattedConfig.ENABLE_SMTP === "1");
    }
  }, [formattedConfig]);

  return (
    <PageWrapper
      size="lg"
      header={{
        icon: Mail,
        title: t("god_mode.pages.email.title"),
        description: (
          <>
            {t("god_mode.pages.email.detail")}
            <span className="mt-1 block text-danger-primary">{t("god_mode.pages.email.warning")}</span>
          </>
        ),
        highlights: [
          { label: "SMTP", icon: Server, tone: "accent" },
          { label: t("god_mode.nav.email.name"), icon: Mail, tone: "success" },
          { label: "TLS / SSL", icon: Shield, tone: "warning" },
        ],
      }}
    >
      <div className="space-y-6">
        <AdminSettingsPanel
          title={t("god_mode.pages.email.title")}
          description={t("god_mode.pages.email.description")}
          icon={Mail}
          iconClassName="text-accent-primary"
          glowActive={isSMTPEnabled}
        >
          {isLoading ? (
            <Loader>
              <Loader.Item height="48px" width="100%" />
            </Loader>
          ) : (
            <AdminToggleCard
              label={t("god_mode.pages.email.title")}
              description={t("god_mode.pages.email.detail")}
              value={isSMTPEnabled}
              onChange={handleToggle}
              disabled={isSubmitting}
            />
          )}
        </AdminSettingsPanel>

        {isSMTPEnabled && !isLoading && formattedConfig ? (
          <InstanceEmailForm config={formattedConfig} />
        ) : !isLoading && !isSMTPEnabled ? (
          <AdminEmptyState
            icon={Mail}
            title={t("god_mode.pages.email.title")}
            description={t("god_mode.pages.email.description")}
          />
        ) : isSMTPEnabled && !formattedConfig ? (
          <Loader className="space-y-4">
            <Loader.Item height="140px" width="100%" />
            <Loader.Item height="280px" width="100%" />
          </Loader>
        ) : null}
      </div>
    </PageWrapper>
  );
});

export const meta: Route.MetaFunction = () => [{ title: "Email Settings - God Mode" }];

export default InstanceEmailPage;
