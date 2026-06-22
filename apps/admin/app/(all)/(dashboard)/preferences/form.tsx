import { observer } from "mobx-react";
import { useTheme as useNextTheme } from "next-themes";
import { Languages, Palette } from "lucide-react";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import { useTranslation } from "@operis/i18n";
import { CustomSelect } from "@operis/ui";
import { AdminConfigSection, AdminFieldLabel, AdminSettingsPanel } from "@/components/settings/admin-settings-panel";

const ADMIN_THEME_OPTIONS = [
  { value: "system", labelKey: "system_preference" },
  { value: "light", labelKey: "light" },
  { value: "dark", labelKey: "dark" },
] as const;

type AdminThemeValue = (typeof ADMIN_THEME_OPTIONS)[number]["value"];

export const AdminPreferencesForm = observer(function AdminPreferencesForm() {
  const { t, currentLocale, changeLanguage, languages } = useTranslation();
  const { theme, setTheme } = useNextTheme();

  const currentTheme = (theme ?? "system") as AdminThemeValue;
  const currentThemeOption =
    ADMIN_THEME_OPTIONS.find((option) => option.value === currentTheme) ?? ADMIN_THEME_OPTIONS[0];

  const handleThemeChange = (value: AdminThemeValue) => {
    setTheme(value);
    setToast({
      type: TOAST_TYPE.SUCCESS,
      title: t("preferences_toast.generic_success_title"),
      message: t("god_mode.preferences.theme_updated"),
    });
  };

  const handleLanguageChange = async (value: string) => {
    try {
      await changeLanguage(value as typeof currentLocale);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("preferences_toast.generic_success_title"),
        message: t("preferences_toast.language_success"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("preferences_toast.generic_error_title"),
        message: t("preferences_toast.language_error"),
      });
    }
  };

  const getLanguageLabel = (value: string) => languages.find((language) => language.value === value)?.label ?? value;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <AdminSettingsPanel
        title={t("theme")}
        description={t("select_or_customize_your_interface_color_scheme")}
        icon={Palette}
        iconClassName="text-accent-primary"
        fillHeight
      >
        <AdminConfigSection title={t("theme")}>
          <div className="space-y-2">
            <AdminFieldLabel>{t("theme")}</AdminFieldLabel>
            <CustomSelect
              value={currentThemeOption.value}
              label={t(currentThemeOption.labelKey)}
              onChange={(value: string) => handleThemeChange(value as AdminThemeValue)}
              buttonClassName="!w-full !rounded-xl !border !border-subtle !bg-layer-2/50 !px-3 !py-2.5"
              className="w-full rounded-xl"
              input
              placement="bottom-start"
            >
              {ADMIN_THEME_OPTIONS.map((option) => (
                <CustomSelect.Option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          </div>
        </AdminConfigSection>
      </AdminSettingsPanel>

      <AdminSettingsPanel
        title={t("language")}
        description={t("language_setting")}
        icon={Languages}
        iconClassName="text-accent-primary"
        fillHeight
      >
        <AdminConfigSection title={t("language")}>
          <div className="space-y-2">
            <AdminFieldLabel>{t("language")}</AdminFieldLabel>
            <CustomSelect
              value={currentLocale}
              label={getLanguageLabel(currentLocale)}
              onChange={handleLanguageChange}
              buttonClassName="!w-full !rounded-xl !border !border-subtle !bg-layer-2/50 !px-3 !py-2.5"
              className="w-full rounded-xl"
              input
              placement="bottom-start"
            >
              {languages.map((language) => (
                <CustomSelect.Option key={language.value} value={language.value}>
                  {language.label}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          </div>
        </AdminConfigSection>
      </AdminSettingsPanel>
    </div>
  );
});
