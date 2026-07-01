import { TranslationProvider } from "@operoz/i18n";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  return <TranslationProvider>{children}</TranslationProvider>;
}
