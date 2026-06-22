import { TranslationProvider } from "@operis/i18n";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  return <TranslationProvider>{children}</TranslationProvider>;
}
