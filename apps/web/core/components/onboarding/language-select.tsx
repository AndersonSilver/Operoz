import { observer } from "mobx-react";
import { Languages } from "lucide-react";
import type { TLanguage } from "@operoz/i18n";
import { DEFAULT_LOCALE, SUPPORTED_LANGUAGES, useTranslation } from "@operoz/i18n";
import { CustomSelect } from "@operoz/ui";
import { useUserProfile } from "@/hooks/store/user";

export const OnboardingLanguageSelect = observer(function OnboardingLanguageSelect() {
  const { currentLocale, changeLanguage, t } = useTranslation();
  const { data: profile, updateUserProfile } = useUserProfile();

  const value = (profile?.language as TLanguage | undefined) || currentLocale || DEFAULT_LOCALE;
  const label = SUPPORTED_LANGUAGES.find((item) => item.value === value)?.label ?? t("select_language");

  const handleChange = async (lng: string) => {
    const nextLocale = lng as TLanguage;
    changeLanguage(nextLocale);
    try {
      await updateUserProfile({ language: nextLocale });
    } catch {
      // Mantém a troca local mesmo se o perfil ainda não existir no servidor.
    }
  };

  return (
    <CustomSelect
      value={value}
      onChange={handleChange}
      placement="bottom-end"
      customButton={
        <span
          className="inline-flex items-center gap-1.5 rounded-md border border-subtle bg-layer-1 px-2.5 py-1.5 text-13 text-secondary hover:bg-layer-transparent-hover"
          aria-label={t("language")}
        >
          <Languages className="size-3.5 shrink-0" strokeWidth={1.75} />
          <span className="max-w-[8.5rem] truncate">{label}</span>
        </span>
      }
    >
      {SUPPORTED_LANGUAGES.map((item) => (
        <CustomSelect.Option key={item.value} value={item.value}>
          {item.label}
        </CustomSelect.Option>
      ))}
    </CustomSelect>
  );
});
