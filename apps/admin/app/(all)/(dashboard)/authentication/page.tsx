import { useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
import useSWR from "swr";
import { Lock, UserPlus } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { setPromiseToast, setToast, TOAST_TYPE } from "@operoz/propel/toast";
import type { TInstanceConfigurationKeys, TInstanceAuthenticationModes } from "@operoz/types";
import { Loader } from "@operoz/ui";
import { resolveGeneralTheme } from "@operoz/utils";
import { PageWrapper } from "@/components/common/page-wrapper";
import { AdminGridCard, AdminSettingsPanel, AdminToggleCard } from "@/components/settings/admin-settings-panel";
import { AdminSectionHeader } from "@/components/settings/admin-section-header";
import { canDisableAuthMethod } from "@/helpers/authentication";
import { useAuthenticationModes } from "@/hooks/oauth";
import { useInstance } from "@/hooks/store";
import type { Route } from "./+types/page";

const InstanceAuthenticationPage = observer(function InstanceAuthenticationPage(_props: Route.ComponentProps) {
  const { t } = useTranslation();
  const { resolvedTheme: resolvedThemeAdmin } = useTheme();
  const resolvedTheme = resolveGeneralTheme(resolvedThemeAdmin);
  const authenticationModesRef = useRef<TInstanceAuthenticationModes[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { fetchInstanceConfigurations, formattedConfig, updateInstanceConfigurations } = useInstance();
  const enableSignUpConfig = formattedConfig?.ENABLE_SIGNUP ?? "";

  useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());

  const updateConfig = useCallback(
    (key: TInstanceConfigurationKeys, value: string): void => {
      if (value === "0") {
        const currentAuthModes = authenticationModesRef.current;
        const isAuthMethodKey = currentAuthModes.some((method) => method.enabledConfigKey === key);

        if (isAuthMethodKey) {
          const canDisable = canDisableAuthMethod(key, currentAuthModes, formattedConfig);

          if (!canDisable) {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: t("god_mode.pages.authentication.cannot_disable_title"),
              message: t("god_mode.pages.authentication.cannot_disable_message"),
            });
            return;
          }
        }
      }

      setIsSubmitting(true);

      const updateConfigPromise = updateInstanceConfigurations({ [key]: value });

      setPromiseToast(updateConfigPromise, {
        loading: t("god_mode.common.config_saving"),
        success: {
          title: t("god_mode.common.success"),
          message: () => t("god_mode.common.config_saved"),
        },
        error: {
          title: t("god_mode.common.error"),
          message: () => t("god_mode.common.config_save_failed"),
        },
      });

      void updateConfigPromise
        .then(() => {
          setIsSubmitting(false);
          return undefined;
        })
        .catch((err) => {
          console.error(err);
          setIsSubmitting(false);
        });
    },
    [formattedConfig, updateInstanceConfigurations, t]
  );

  const authenticationModes = useAuthenticationModes({
    disabled: isSubmitting,
    updateConfig,
    resolvedTheme,
  });

  authenticationModesRef.current = authenticationModes;

  const signupEnabled = Boolean(parseInt(enableSignUpConfig));
  const activeMethodsCount = authenticationModes.filter((method) => {
    const key = method.enabledConfigKey as TInstanceConfigurationKeys | undefined;
    if (!key || !formattedConfig) return false;
    return Boolean(parseInt(formattedConfig[key] ?? "0", 10));
  }).length;

  return (
    <PageWrapper
      size="lg"
      header={{
        icon: Lock,
        title: t("god_mode.pages.authentication.title"),
        description: t("god_mode.pages.authentication.description"),
        highlights: [
          { label: t("god_mode.nav.authentication.name"), icon: Lock, tone: "accent" },
          { label: t("god_mode.pages.authentication.signup_toggle_title"), icon: UserPlus, tone: "success" },
        ],
      }}
    >
      {formattedConfig ? (
        <div className="space-y-6">
          <AdminSettingsPanel
            title={t("god_mode.pages.authentication.signup_toggle_title")}
            description={t("god_mode.pages.authentication.signup_toggle_desc")}
            icon={UserPlus}
            iconClassName="text-accent-primary"
            glowActive={signupEnabled}
          >
            <AdminToggleCard
              label={t("god_mode.pages.authentication.signup_toggle_title")}
              description={t("god_mode.pages.authentication.signup_toggle_desc")}
              value={signupEnabled}
              onChange={() => updateConfig("ENABLE_SIGNUP", signupEnabled ? "0" : "1")}
              disabled={isSubmitting}
            />
          </AdminSettingsPanel>

          <section>
            <AdminSectionHeader
              title={t("god_mode.pages.authentication.modes_title")}
              count={authenticationModes.length}
              hint={
                activeMethodsCount > 0
                  ? `${activeMethodsCount} ${t("god_mode.common.active").toLowerCase()}`
                  : undefined
              }
            />
            <div className="admin-card-grid">
              {authenticationModes.map((method) => {
                const configKey = method.enabledConfigKey as TInstanceConfigurationKeys | undefined;
                const isEnabled = configKey ? Boolean(parseInt(formattedConfig?.[configKey] ?? "0", 10)) : false;

                return (
                  <AdminGridCard
                    key={method.key}
                    title={method.name}
                    description={method.description}
                    isActive={isEnabled && !method.unavailable}
                    icon={
                      <span
                        className={
                          isEnabled
                            ? "shadow-sm grid size-10 place-items-center rounded-lg border border-subtle bg-accent-subtle/70 text-accent-primary"
                            : "grid size-10 place-items-center rounded-lg border border-subtle bg-layer-2 text-tertiary"
                        }
                      >
                        {method.icon}
                      </span>
                    }
                    badges={
                      <span
                        className={
                          isEnabled
                            ? "rounded-full bg-success-subtle px-2 py-0.5 text-10 font-semibold tracking-wide text-success-primary uppercase"
                            : "rounded-full bg-layer-2 px-2 py-0.5 text-10 font-semibold tracking-wide text-tertiary uppercase"
                        }
                      >
                        {isEnabled ? t("god_mode.common.active") : t("god_mode.common.inactive")}
                      </span>
                    }
                    footer={<div className={method.unavailable ? "opacity-50" : ""}>{method.config}</div>}
                  />
                );
              })}
            </div>
          </section>
        </div>
      ) : (
        <Loader className="space-y-4">
          <Loader.Item height="140px" width="100%" />
          <Loader.Item height="280px" width="100%" />
        </Loader>
      )}
    </PageWrapper>
  );
});

export const meta: Route.MetaFunction = () => [{ title: "Authentication Settings - God Mode" }];

export default InstanceAuthenticationPage;
